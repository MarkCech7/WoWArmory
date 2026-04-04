import re
from fastapi import APIRouter, HTTPException
from db import get_characters_connection
from rag import index_character
from utils import get_class_name, get_slot_name, get_race_name, compute_average_item_level

router = APIRouter()

# Matches tokens like:
#   $71905s1   $71904a1   $73422d   $71905u   $/1000;s1   $s2
# Groups: (divisor|None, spell_id|"", token_type, effect_index|"")
# Matches arithmetic expression tokens like ${8-1}, ${10+2}, ${4*3}
_TOKEN_RE = re.compile(r'\$(?:\/(\d+);)?(\d*)([suadm])(\d*)')


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
        sid: {"effects": {}, "cumulative_aura": 0, "duration_ms": 0}
        for sid in spell_ids
    }

    # SpellEffect: base points, die sides, radius
    # EffectIndex is 0-based in DB2; tokens are 1-based
    cursor.execute(f"""
        SELECT
            se.SpellID,
            se.EffectIndex,
            se.EffectBasePoints,
            se.EffectDieSides,
            COALESCE(sr.Radius, 0) AS Radius
        FROM web.spell_effect AS se
        LEFT JOIN web.spell_radius AS sr ON sr.ID = se.EffectRadiusIndex1
        WHERE se.SpellID IN ({ids_sql})
        ORDER BY se.SpellID, se.EffectIndex
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["effects"][row["EffectIndex"] + 1] = {
            "base_points": row["EffectBasePoints"],
            "die_sides":   row["EffectDieSides"],
            "radius":      row["Radius"],
        }

    # SpellAuraOptions: stack count ($u token)
    cursor.execute(f"""
        SELECT SpellID, CumulativeAura
        FROM web.spell_aura_options
        WHERE SpellID IN ({ids_sql})
    """)
    for row in cursor.fetchall():
        data[row["SpellID"]]["cumulative_aura"] = row["CumulativeAura"]

    # SpellMisc + SpellDuration: duration ($d token)
    cursor.execute(f"""
        SELECT sm.SpellID, sd.Duration AS duration_ms
        FROM web.spell_misc AS sm
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
    divisor: int,
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
            # Range display: (base+1) to (base+die)
            lo = abs(base + 1) // divisor
            hi = abs(base + die) // divisor
            return f"{lo} to {hi}"
        else:
            # die == 0 or 1: displayed value = base + die
            # abs() because DB stores reductions as negatives; tooltip text carries the meaning
            return str(abs(base + die) // divisor)

    elif token_type == "m":
        # Minimum value — EffectBasePoints without die
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"

        return str(abs(effect["base_points"]) // divisor)

    elif token_type == "u":
        return str(entry["cumulative_aura"] // divisor)

    elif token_type == "a":
        effect = entry["effects"].get(effect_idx)

        if effect is None:
            return "?"
        
        return str(int(effect["radius"]) // divisor)

    elif token_type == "d":
        return _format_duration(entry["duration_ms"] // divisor if divisor > 1 else entry["duration_ms"])

    return "?"


def resolve_spell_descriptions(items: list[dict], cursor) -> None:
    descriptions = [item.get("Description") or item.get("description") or "" for item in items]
    spell_ids = _extract_spell_ids(descriptions)

    # Also pre-load each item's own spell so bare tokens always resolve
    for item in items:
        sid = item.get("spellId")

        if sid:
            spell_ids.add(int(sid))

    if not spell_ids:
        return

    spell_data = _fetch_spell_data(cursor, spell_ids)

    for item in items:
        raw = item.get("Description") or item.get("description")
        if not raw:
            continue

        current_spell_id: int | None = item.get("spellId")

        def replace_token(m: re.Match) -> str:
            divisor_str, spell_id_str, token_type, idx_str = m.groups()

            return _resolve_token(
                divisor          = int(divisor_str) if divisor_str else 1,
                spell_id         = int(spell_id_str) if spell_id_str else None,
                token_type       = token_type,
                effect_idx       = int(idx_str) if idx_str else 1,
                spell_data       = spell_data,
                current_spell_id = current_spell_id,
            )

        resolved = _TOKEN_RE.sub(replace_token, raw)
        resolved = re.sub(r'\$\{([\d\s+\-*/]+)\}', lambda m: str(int(eval(m.group(1)))), resolved)

        if "Description" in item:
            item["Description"] = resolved
        else:
            item["description"] = resolved

def load_character(name: str) -> dict:

    conn = get_characters_connection()
    try:
        with conn.cursor() as cursor:

            # equipped items
            cursor.execute("""
                SELECT
                item.guid as item_guid,
                item.itemEntry,
                item.owner_guid as owner,
                item.enchantments,
                inv.slot,
                char.guid as char_guid,
                COALESCE(itemdb_hf.Display, itemdb.Display) as item_name,
                COALESCE(itemdb_hf.OverallQualityID, itemdb.OverallQualityID) as OverallQualityID,
                COALESCE(itemdb_hf.Flags1, itemdb.Flags1) as Flags1,
                COALESCE(itemdb_hf.ItemLevel, itemdb.ItemLevel) as ItemLevel,
                COALESCE(itemdb_hf.InventoryType, itemdb.InventoryType) as InventoryType,
                COALESCE(itemdb_hf.Resistances1, itemdb.Resistances1) as Resistances1,
                COALESCE(itemdb_hf.MinDamage1, itemdb.MinDamage1) as MinDamage1,
                COALESCE(itemdb_hf.MaxDamage1, itemdb.MaxDamage1) as MaxDamage1,
                COALESCE(itemdb_hf.ItemDelay, itemdb.ItemDelay) as ItemDelay,
                COALESCE(itemdb_hf.StatModifierBonusStat1, itemdb.StatModifierBonusStat1) as StatModifierBonusStat1,
                COALESCE(itemdb_hf.StatModifierBonusStat2, itemdb.StatModifierBonusStat2) as StatModifierBonusStat2,
                COALESCE(itemdb_hf.StatModifierBonusStat3, itemdb.StatModifierBonusStat3) as StatModifierBonusStat3,
                COALESCE(itemdb_hf.StatModifierBonusStat4, itemdb.StatModifierBonusStat4) as StatModifierBonusStat4,
                COALESCE(itemdb_hf.StatModifierBonusStat5, itemdb.StatModifierBonusStat5) as StatModifierBonusStat5,
                COALESCE(itemdb_hf.StatModifierBonusStat6, itemdb.StatModifierBonusStat6) as StatModifierBonusStat6,
                COALESCE(itemdb_hf.StatModifierBonusAmount1, itemdb.StatModifierBonusAmount1) as StatModifierBonusAmount1,
                COALESCE(itemdb_hf.StatModifierBonusAmount2, itemdb.StatModifierBonusAmount2) as StatModifierBonusAmount2,
                COALESCE(itemdb_hf.StatModifierBonusAmount3, itemdb.StatModifierBonusAmount3) as StatModifierBonusAmount3,
                COALESCE(itemdb_hf.StatModifierBonusAmount4, itemdb.StatModifierBonusAmount4) as StatModifierBonusAmount4,
                COALESCE(itemdb_hf.StatModifierBonusAmount5, itemdb.StatModifierBonusAmount5) as StatModifierBonusAmount5,
                COALESCE(itemdb_hf.StatModifierBonusAmount6, itemdb.StatModifierBonusAmount6) as StatModifierBonusAmount6,
                COALESCE(itemdb_hf.MaxDurability, itemdb.MaxDurability) as MaxDurability,
                COALESCE(itemdb_hf.RequiredLevel, itemdb.RequiredLevel) as RequiredLevel,
                COALESCE(itemdb_hf.SocketMatchEnchantmentID, itemdb.SocketMatchEnchantmentID) as SocketMatchEnchantmentID,
                COALESCE(itemdb_hf.AllowableClass, itemdb.AllowableClass) as AllowableClass,
                COALESCE(itemdb_hf.ItemSet, itemdb.ItemSet) as ItemSet,
                COALESCE(itemdb_hf.SocketType1, itemdb.SocketType1) as SocketType1,
                COALESCE(itemdb_hf.SocketType2, itemdb.SocketType2) as SocketType2,
                COALESCE(itemdb_hf.SocketType3, itemdb.SocketType3) as SocketType3,
                COALESCE(itemdb_hf.GemProperties, itemdb.GemProperties) as GemProperties,
                COALESCE(itemdb2_hf.ClassID, itemdb2.ClassID) as ClassID,
                COALESCE(itemdb2_hf.SubClassID, itemdb2.SubClassID) as SubClassID,
                COALESCE(itemdb2_hf.IconFileDataID, itemdb2.IconFileDataID) as IconFileDataID,
                icon.IconName,
                COALESCE(transmogsource_hf.ID, transmogsource.ID) as transmog_appearance_id,
                COALESCE(transmogsource_hf.ItemID, transmogsource.ItemID) as transmog_item_id,
                COALESCE(transmog_itemdb_hf.Display, transmog_itemdb.Display) as transmog_item_name,
                (
                    SELECT GROUP_CONCAT(CONCAT(sp.ID, '::', sp.Description) SEPARATOR '||')
                    FROM web.item_effect AS eff
                    LEFT JOIN web.spell AS sp ON sp.ID = eff.SpellID
                    WHERE eff.ParentItemID = item.itemEntry
                    AND eff.TriggerType != 5
                    AND sp.Description IS NOT NULL
                    AND sp.Description != ''
                ) as Description,
                (
                    SELECT MIN(eff.TriggerType)
                    FROM web.item_effect AS eff
                    WHERE eff.ParentItemID = item.itemEntry
                    AND eff.TriggerType != 5
                ) as TriggerType
                FROM characters.item_instance AS item
                INNER JOIN characters.characters AS `char` ON item.owner_guid = `char`.guid
                INNER JOIN characters.character_inventory AS inv ON item.guid = inv.item AND inv.bag = 0 AND inv.slot <= 18
                LEFT JOIN web.item_sparse AS itemdb ON itemdb.ID = item.itemEntry
                LEFT JOIN hotfixes.item_sparse AS itemdb_hf ON itemdb_hf.ID = item.itemEntry
                LEFT JOIN web.item AS itemdb2 ON itemdb2.ID = item.itemEntry
                LEFT JOIN hotfixes.item AS itemdb2_hf ON itemdb2_hf.ID = item.itemEntry
                LEFT JOIN characters.item_instance_transmog AS transmog ON transmog.itemGuid = item.guid
                LEFT JOIN web.icon_data AS icon ON icon.DataFileID = itemdb2.IconFileDataID
                LEFT JOIN web.item_modified_appearance AS transmogsource ON transmogsource.ID = transmog.itemModifiedAppearanceAllSpecs
                LEFT JOIN hotfixes.item_modified_appearance AS transmogsource_hf ON transmogsource_hf.ID = transmog.itemModifiedAppearanceAllSpecs
                LEFT JOIN web.item_sparse AS transmog_itemdb ON transmog_itemdb.ID = transmogsource.ItemID
                LEFT JOIN hotfixes.item_sparse AS transmog_itemdb_hf ON transmog_itemdb_hf.ID = transmogsource_hf.ItemID
                WHERE `char`.name = %s
                ORDER BY inv.slot
            """, (name,))
            equipped_items_data = cursor.fetchall()

            # enchantments
            enchant_ids = list({
                int(i)
                for item in equipped_items_data
                for i in item["enchantments"].split(" ")
                if i not in ("0", "")
            })

            enchants_by_id = {}
            if enchant_ids:
                cursor.execute(
                    f"SELECT ID as id, Name as name FROM web.spell_item_enchantment WHERE ID IN ({','.join(str(i) for i in enchant_ids)})"
                )
                enchants_by_id = {row["id"]: row for row in cursor.fetchall()}

            equipped_items = []
            for item in equipped_items_data:
                parts = item["enchantments"].split(" ")
                enchantments = []
                for idx, part in enumerate(parts):
                    if part in ("0", ""):
                        continue
                    enchant = enchants_by_id.get(int(part))
                    if enchant:
                        enchantments.append({"index": idx / 3, **enchant})
                new_item = ({**item, "enchantments": enchantments})
                new_item["slot_name"] = get_slot_name(item["InventoryType"])
                equipped_items.append(new_item)

            for item in equipped_items:
                raw = item.get("Description") or ""
                parsed_spells = []
                for part in raw.split("||"):
                    if "::" not in part:
                        continue
                    spell_id_str, desc = part.split("::", 1)
                    parsed_spells.append({"spellId": int(spell_id_str), "Description": desc})
 
                resolve_spell_descriptions(parsed_spells, cursor)
                item["Description"] = "||".join(sp["Description"] for sp in parsed_spells)

            # char info
            cursor.execute(f"""
                SELECT
                    characters.name,
                    characters.race,
                    characters.class,
                    characters.level,
                    characters.chosenTitle as title,
                    COALESCE(title_db_hf.Name, title_db.Name) as actual_title,
                    guild.name as guild_name,
                    (
                        SELECT tt.Name
                        FROM characters.character_talent ct
                        INNER JOIN web.talent t ON t.ID = ct.TalentID
                        INNER JOIN web.talent_tab tt ON tt.ID = t.TabID
                        WHERE ct.guid = characters.guid
                        AND ct.TalentGroup = 0
                        GROUP BY tt.ID, tt.Name
                        ORDER BY SUM(ct.Rank + 1) DESC
                        LIMIT 1
                    ) as spec_name,
                    (
                        SELECT tt.ID
                        FROM characters.character_talent ct
                        INNER JOIN web.talent t ON t.ID = ct.TalentID
                        INNER JOIN web.talent_tab tt ON tt.ID = t.TabID
                        WHERE ct.guid = characters.guid
                        AND ct.TalentGroup = 0
                        GROUP BY tt.ID
                        ORDER BY SUM(ct.Rank + 1) DESC
                        LIMIT 1
                    ) as spec
                FROM characters.characters
                LEFT JOIN web.char_titles AS title_db ON title_db.MaskID = characters.chosenTitle
                LEFT JOIN hotfixes.char_titles AS title_db_hf ON title_db_hf.MaskID = characters.chosenTitle
                LEFT JOIN characters.guild_member ON guild_member.guid = characters.guid
                LEFT JOIN characters.guild ON guild.guildid = guild_member.guildid
                WHERE characters.name = %s
            """, (name,))
            char_info = cursor.fetchone()
            if char_info:
                char_info["race_name"] = get_race_name(char_info["race"])
                char_info["class_name"] = get_class_name(char_info["class"])
                char_info["spec_name"] = char_info["spec_name"] or ""
                char_info["spec"] = char_info["spec"] or ""

            cursor.execute("""
                SELECT
                    c.health,
                    c.power1,
                    c.power2,
                    c.power3,
                    c.power4,
                    c.power5,
                    c.power6,
                    c.power7,
                    cs.strength,
                    cs.agility,
                    cs.stamina,
                    cs.intellect,
                    cs.spirit,
                    cs.armor,
                    cs.resArcane as res_arcane,
                    cs.resFire as res_fire,
                    cs.resFrost as res_frost,
                    cs.resNature as res_nature,
                    cs.resShadow as res_shadow,
                    cs.blockPct as block_pct,
                    cs.dodgePct as dodge_pct,
                    cs.parryPct as parry_pct,
                    cs.critPct as crit_pct,
                    cs.rangedCritPct as ranged_crit_pct,
                    cs.spellCritPct as spell_crit_pct,
                    cs.attackPower as attack_power,
                    cs.rangedAttackPower as ranged_attack_power,
                    cs.spellPower as spell_power
                FROM characters.characters c
                LEFT JOIN characters.character_stats cs ON cs.guid = c.guid
                WHERE c.name = %s
            """, (name,))
            char_stats = cursor.fetchone()

            cursor.execute("""
                SELECT
                    cs.skill,
                    cs.value,
                    cs.max,
                    cs.professionSlot as profession_slot,
                    sl.DisplayName as skill_name,
                    sl.CategoryID as category_id,
                    icon.IconName as icon_name
                FROM characters.character_skills cs
                LEFT JOIN web.skill_line sl ON sl.ID = cs.skill
                LEFT JOIN web.icon_data icon ON icon.DataFileID = sl.SpellIconFileID
                WHERE cs.guid = (SELECT guid FROM characters.characters WHERE name = %s)
            """, (name,))
            char_skills = cursor.fetchall()

            # item sets
            set_ids = list({
                item["ItemSet"]
                for item in equipped_items_data
                if item.get("ItemSet") and item["ItemSet"] != 0
            })

            item_set_data = {}
            if set_ids:
                set_ids_sql = ",".join(str(s) for s in set_ids)

                cursor.execute(f"""
                    SELECT ID, Name,
                        ItemID1, ItemID2, ItemID3, ItemID4, ItemID5,
                        ItemID6, ItemID7, ItemID8, ItemID9, ItemID10,
                        ItemID11, ItemID12, ItemID13, ItemID14, ItemID15,
                        ItemID16, ItemID17
                    FROM web.item_set WHERE ID IN ({set_ids_sql})
                """)
                item_sets = cursor.fetchall()

                set_item_ids = list({
                    item_id
                    for s in item_sets
                    for key in [f"ItemID{i}" for i in range(1, 18)]
                    if (item_id := s.get(key)) and item_id != 0
                })

                set_item_names_by_id = {}
                if set_item_ids:
                    cursor.execute(
                        f"SELECT ID, InventoryType, Display as name FROM web.item_sparse WHERE ID IN ({','.join(str(i) for i in set_item_ids)})"
                    )
                    rows = cursor.fetchall()
                    set_item_inv_types = {row["ID"]: row["InventoryType"] for row in rows}
                    set_item_names_by_id = {row["ID"]: row["name"] for row in rows}

                cursor.execute(f"""
                    SELECT iss.ID, iss.SpellID, iss.Threshold as threshold,
                           iss.ItemSetID, sp.Description as description
                    FROM web.item_set_spell AS iss
                    LEFT JOIN web.spell AS sp ON sp.ID = iss.SpellID
                    WHERE iss.ItemSetID IN ({set_ids_sql})
                    ORDER BY iss.Threshold ASC
                """)
                set_spells = cursor.fetchall()

                spells_by_set_id: dict[int, list] = {}
                for spell in set_spells:
                    spells_by_set_id.setdefault(spell["ItemSetID"], []).append(spell)

                for s in item_sets:
                    fallback_ids = [
                        s[f"ItemID{i}"] for i in range(1, 18)
                        if s.get(f"ItemID{i}") and s[f"ItemID{i}"] != 0
                    ]
                    equipped_set_items = [
                        item for item in equipped_items_data
                        if item.get("ItemSet") == s["ID"]
                    ]
                    equipped_count = len(equipped_set_items)
                    # map InventoryType to equipped item
                    equipped_by_inv_type = {item["InventoryType"]: item for item in equipped_set_items}

                    pieces = [
                        {
                            "itemId": fid,
                            "name": equipped_by_inv_type.get(set_item_inv_types.get(fid), {}).get("item_name")
                                    or set_item_names_by_id.get(fid, f"Item {fid}"),
                            "equipped": set_item_inv_types.get(fid) in equipped_by_inv_type,
                        }
                        for fid in fallback_ids
                    ]
                    item_set_data[s["ID"]] = {
                        "id": s["ID"],
                        "name": s["Name"],
                        "equippedCount": equipped_count,
                        "pieces": pieces,
                        "spells": [
                            {
                                "spellId": spell["SpellID"],
                                "threshold": spell["threshold"],
                                "description": spell["description"],
                                "active": equipped_count >= spell["threshold"],
                            }
                            for spell in spells_by_set_id.get(s["ID"], [])
                        ],
                    }

            for set_data in item_set_data.values():
                resolve_spell_descriptions(set_data["spells"], cursor)

    finally:
        conn.close()

    return {
        "charInfo": char_info,
        "charStats": char_stats,
        "equippedItems": equipped_items,
        "itemSetData": item_set_data,
        "average_item_level": compute_average_item_level(equipped_items),
        "char_skills": char_skills
    }


@router.get("/armory/{name}")
def get_armory(name: str):
    data = load_character(name)

    if not data:
        raise HTTPException(status_code=404, detail="Character not found")
    index_character(data)

    return data

if __name__ == "__main__":
    import json
    data = load_character("Provimsen")
    print(json.dumps(data, indent=2, default=str))