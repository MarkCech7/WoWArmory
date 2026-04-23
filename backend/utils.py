import re

CLASS_NAMES = {
    1: "Warrior",
    2: "Paladin",
    3: "Hunter",
    4: "Rogue",
    5: "Priest",
    6: "Death Knight",
    7: "Shaman",
    8: "Mage",
    10: "Warlock",
    11: "Druid",
}

SLOT_NAMES = {
    1: "Head",
    2: "Neck",
    3: "Shoulders",
    4: "Shirt",
    5: "Chest",
    6: "Waist",
    7: "Legs",
    8: "Feet",
    9: "Wrists",
    10: "Hands",
    11: "Finger",
    12: "Trinket",
    13: "One-Hand",
    14: "Shield",
    15: "Ranged",
    16: "Back",
    17: "Two-Hand",
    19: "Tabard",
    20: "Robe",
    21: "Main hand",
    22: "Off hand",
    23: "Held in Off-Hand",
    25: "Thrown",
    26: "Ranged",
    28: "Relic",
}

RACE_NAMES = {
    1: "Human",
    2: "Orc",
    3: "Dwarf",
    4: "Night Elf",
    5: "Undead",
    6: "Tauren",
    7: "Gnome",
    8: "Troll",
    10: "Blood Elf",
    11: "Draenei",
}

ALLIANCE_RACES = {1, 3, 4, 7, 11}  # Human, Dwarf, Night Elf, Gnome, Draenei
HORDE_RACES = {2, 5, 6, 8, 10}     # Orc, Undead, Tauren, Troll, Blood Elf
GEAR_SLOTS = {0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17}
TWO_HAND_INVENTORY_TYPE = {17}
LOWERCASE_WORDS = {"of", "the", "and", "in", "a", "an", "to"}

def get_class_name(class_id: int) -> str:
    return CLASS_NAMES.get(class_id, "")

def get_slot_name(slot_id: int) -> str:
    return SLOT_NAMES.get(slot_id, "")

def get_race_name(race_id: int) -> str:
    return RACE_NAMES.get(race_id, "")

def compute_average_item_level(equipped_items: list[dict]) -> float:
    ilvl_by_slot = {
        item["slot"]: item["item_level"]
        for item in equipped_items
        if item["slot"] in GEAR_SLOTS
    }

    total = 0

    for slot in GEAR_SLOTS:
        ilvl = ilvl_by_slot.get(slot, 0)
        total += ilvl

    # 2H weapon: also add its ilvl for the offhand slot
    two_hander = next(
        (item for item in equipped_items if item["inventory_type"] in TWO_HAND_INVENTORY_TYPE),
        None
    )

    if two_hander:
        total += two_hander["item_level"]

    return int(total / len(GEAR_SLOTS))

# Matches tokens like:
#   $71905s1   $71904a1   $73422d   $71905u   $/1000;s1   $s2
# Groups: (divisor|None, spell_id|"", token_type, effect_index|"")
# Matches arithmetic expression tokens like ${8-1}, ${10+2}, ${4*3}
_TOKEN_RE = re.compile(r'\$(?:([\*\/])(\d+);)?(\d*)([suadmoit])(\d*)')


def _extract_spell_ids(descriptions: list[str]) -> set[int]:
    ids = set()

    for desc in descriptions:
        if not desc:
            continue

        for m in _TOKEN_RE.finditer(desc):
            spell_id_str = m.group(2)

            if spell_id_str:
                ids.add(int(spell_id_str))
    
    return ids


def _fetch_spell_data(cursor, spell_ids: set[int]) -> dict:
    if not spell_ids:
        return {}

    ids_sql = ",".join(str(i) for i in spell_ids)
    data: dict[int, dict] = {
        sid: {"effects": {}, "cumulative_aura": 0, "duration_ms": 0, "max_targets": 0, "proc_chance": 0, "proc_charges": 0}
        for sid in spell_ids
    }

    # update SpellEffect fetch to also grab EffectAmplitude
    cursor.execute(f"""
        SELECT
            se.SpellID,
            se.EffectIndex,
            se.EffectBasePoints,
            se.EffectDieSides,
            COALESCE(sr.Radius, 0) AS Radius,
            se.EffectAuraPeriod
        FROM web.v_spell_effect AS se
        LEFT JOIN web.spell_radius AS sr ON sr.ID = se.EffectRadiusIndex1
        WHERE se.SpellID IN ({ids_sql})
        ORDER BY se.SpellID, se.EffectIndex
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["effects"][row["EffectIndex"] + 1] = {
            "base_points":          row["EffectBasePoints"],
            "die_sides":            row["EffectDieSides"],
            "radius":               row["Radius"],
            "effect_aura_period":   row["EffectAuraPeriod"],
        }

    # ProcChance + ProcCharges from or spell_aura_options
    cursor.execute(f"""
        SELECT SpellID, ProcChance, ProcCharges
        FROM web.spell_aura_options
        WHERE SpellID IN ({ids_sql})
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["proc_chance"] = row["ProcChance"]
        data[row["SpellID"]]["proc_charges"] = row["ProcCharges"]

    # SpellAuraOptions: stack count ($u token)
    cursor.execute(f"""
        SELECT SpellID, CumulativeAura
        FROM web.v_spell_aura_options
        WHERE SpellID IN ({ids_sql})
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["cumulative_aura"] = row["CumulativeAura"]

    # SpellTargetRestrictions: max targets ($i token)
    cursor.execute(f"""
        SELECT SpellID, MaxTargets
        FROM web.v_spell_target_restrictions
        WHERE SpellID IN ({ids_sql})
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["max_targets"] = row["MaxTargets"]

    # SpellMisc + SpellDuration: duration ($d token)
    cursor.execute(f"""
        SELECT sm.SpellID, sd.Duration AS duration_ms
        FROM web.v_spell_misc AS sm
        LEFT JOIN web.spell_duration AS sd ON sd.ID = sm.DurationIndex
        WHERE sm.SpellID IN ({ids_sql})
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["duration_ms"] = row["duration_ms"] or 0

    return data


def _format_duration(ms: int) -> str:
    seconds = abs(ms) // 1000

    if seconds == 0:
        return "0 sec"
    
    if seconds % 60 == 0:
        return f"{seconds // 60} min"

    return f"{seconds} sec"


def _resolve_token(
    spell_id: int | None,
    token_type: str,
    effect_idx: int,
    spell_data: dict,
    current_spell_id: int | None,
) -> str:
    sid = spell_id if spell_id is not None else current_spell_id

    if sid is None or sid not in spell_data:
        return "?"

    entry = spell_data[sid]

    if token_type == "s":
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"

        base = effect["base_points"]
        die  = effect["die_sides"]

        if die > 1:
            lo = abs(base + 1)
            hi = abs(base + die)
            return f"{lo} to {hi}"
        else:
            return str(abs(base + die))

    elif token_type == "m":
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"

        return str(abs(effect["base_points"]))

    elif token_type == "u":
        return str(entry["cumulative_aura"])

    elif token_type == "i":
        return str(entry["max_targets"])

    elif token_type == "a":
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"

        return str(int(effect["radius"]))

    elif token_type == "d":
        return _format_duration(entry["duration_ms"])

    elif token_type == "o":
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"

        base = effect["base_points"]
        die = effect["die_sides"]
        amplitude_ms = effect.get("effect_aura_period", 0)
        duration_ms = entry["duration_ms"]

        if amplitude_ms <= 0 or duration_ms <= 0:
            return "?"

        damage_per_tick = abs(base + die)
        total = int(damage_per_tick * (duration_ms / amplitude_ms))

        return str(total)

    elif token_type == "t":
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"

        effect_aura_period = effect.get("effect_aura_period", 0)

        if effect_aura_period <= 0:
            return "?"

        seconds = effect_aura_period / 1000
        return str(int(seconds) if seconds == int(seconds) else round(seconds, 1))

    elif token_type == "h":
        return str(entry["proc_chance"])

    elif token_type == "n":
        return str(entry["proc_charges"])

    return "?"


def resolve_spell_descriptions(items: list[dict], cursor) -> None:
    descriptions = [item.get("Description") or item.get("description") or "" for item in items]
    spell_ids = _extract_spell_ids(descriptions)

    for item in items:
        sid = item.get("spell_id")
        if sid:
            spell_ids.add(int(sid))

    if not spell_ids:
        return

    spell_data = _fetch_spell_data(cursor, spell_ids)

    for item in items:
        raw = item.get("Description") or item.get("description")
        if not raw:
            continue

        current_spell_id: int | None = item.get("spell_id")

        def replace_token(m: re.Match) -> str:
            operator, factor_str, spell_id_str, token_type, idx_str = m.groups()

            raw_value_str = _resolve_token(
                spell_id         = int(spell_id_str) if spell_id_str else None,
                token_type       = token_type,
                effect_idx       = int(idx_str) if idx_str else 1,
                spell_data       = spell_data,
                current_spell_id = current_spell_id,
            )

            if operator and factor_str and raw_value_str.lstrip('-').isdigit():
                factor = int(factor_str)
                value = int(raw_value_str)
                if operator == '*':
                    raw_value_str = str(value * factor)
                elif operator == '/':
                    raw_value_str = str(value // factor)

            return raw_value_str

        resolved = _TOKEN_RE.sub(replace_token, raw)

        def resolve_inner(m: re.Match) -> str:
            inner = m.group(1)
            inner = _TOKEN_RE.sub(replace_token, inner)
            try:
                return str(int(eval(inner)))
            except:
                return m.group(0)

        resolved = re.sub(r'\$\{([^}]+)\}', resolve_inner, resolved)

        # strip player-dependent tokens that can't be resolved without game context
        resolved = re.sub(
            r'\$(?:RAP|AP|SPH|SPI|SPS|sps|rwb|RWB|mwb|MWB|mws|MWS|mw|MW|b[1-3]?|B[1-3]?)',
            '0',
            resolved
        )

        if "Description" in item:
            item["Description"] = resolved
        else:
            item["description"] = resolved

def resolve_single_spell_description(spell_id: int, description: str, cursor) -> str:
    item = {"spell_id": spell_id, "description": description}
    resolve_spell_descriptions([item], cursor)

    return item["description"]