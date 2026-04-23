import re
from fastapi import APIRouter, HTTPException
from db import get_characters_connection
from rag import index_character
from utils import get_class_name, get_slot_name, get_race_name, compute_average_item_level, resolve_spell_descriptions
from glyph_utils import GLYPH_ICON_MAP, GLYPH_ICON_MAP_OVERRIDE

router = APIRouter()


def load_character(name: str) -> dict:

    conn = get_characters_connection()
    try:
        with conn.cursor() as cursor:

            # equipped items
            cursor.execute("""
                SELECT
                item.guid as item_guid,
                item.itemEntry as item_entry,
                item.owner_guid as owner,
                item.enchantments,
                inv.slot,
                char.guid as char_guid,
                COALESCE(itemdb_hf.Display, itemdb.Display) as item_name,
                COALESCE(itemdb_hf.OverallQualityID, itemdb.OverallQualityID) as overall_quality_id,
                COALESCE(itemdb_hf.Flags1, itemdb.Flags1) as flags1,
                COALESCE(itemdb_hf.ItemLevel, itemdb.ItemLevel) as item_level,
                COALESCE(itemdb_hf.InventoryType, itemdb.InventoryType) as inventory_type,
                COALESCE(itemdb_hf.Resistances1, itemdb.Resistances1) as resistances1,
                COALESCE(itemdb_hf.MinDamage1, itemdb.MinDamage1) as min_damage1,
                COALESCE(itemdb_hf.MaxDamage1, itemdb.MaxDamage1) as max_damage1,
                COALESCE(itemdb_hf.ItemDelay, itemdb.ItemDelay) as item_delay,
                COALESCE(itemdb_hf.StatModifierBonusStat1, itemdb.StatModifierBonusStat1) as stat_modifier_bonus_stat1,
                COALESCE(itemdb_hf.StatModifierBonusStat2, itemdb.StatModifierBonusStat2) as stat_modifier_bonus_stat2,
                COALESCE(itemdb_hf.StatModifierBonusStat3, itemdb.StatModifierBonusStat3) as stat_modifier_bonus_stat3,
                COALESCE(itemdb_hf.StatModifierBonusStat4, itemdb.StatModifierBonusStat4) as stat_modifier_bonus_stat4,
                COALESCE(itemdb_hf.StatModifierBonusStat5, itemdb.StatModifierBonusStat5) as stat_modifier_bonus_stat5,
                COALESCE(itemdb_hf.StatModifierBonusStat6, itemdb.StatModifierBonusStat6) as stat_modifier_bonus_stat6,
                COALESCE(itemdb_hf.StatModifierBonusAmount1, itemdb.StatModifierBonusAmount1) as stat_modifier_bonus_amount1,
                COALESCE(itemdb_hf.StatModifierBonusAmount2, itemdb.StatModifierBonusAmount2) as stat_modifier_bonus_amount2,
                COALESCE(itemdb_hf.StatModifierBonusAmount3, itemdb.StatModifierBonusAmount3) as stat_modifier_bonus_amount3,
                COALESCE(itemdb_hf.StatModifierBonusAmount4, itemdb.StatModifierBonusAmount4) as stat_modifier_bonus_amount4,
                COALESCE(itemdb_hf.StatModifierBonusAmount5, itemdb.StatModifierBonusAmount5) as stat_modifier_bonus_amount5,
                COALESCE(itemdb_hf.StatModifierBonusAmount6, itemdb.StatModifierBonusAmount6) as stat_modifier_bonus_amount6,
                COALESCE(itemdb_hf.MaxDurability, itemdb.MaxDurability) as max_durability,
                COALESCE(itemdb_hf.RequiredLevel, itemdb.RequiredLevel) as required_level,
                COALESCE(itemdb_hf.SocketMatchEnchantmentID, itemdb.SocketMatchEnchantmentID) as socket_match_enchantment_id,
                COALESCE(itemdb_hf.AllowableClass, itemdb.AllowableClass) as allowable_class,
                COALESCE(itemdb_hf.ItemSet, itemdb.ItemSet) as item_set,
                COALESCE(itemdb_hf.SocketType1, itemdb.SocketType1) as socket_type1,
                COALESCE(itemdb_hf.SocketType2, itemdb.SocketType2) as socket_type2,
                COALESCE(itemdb_hf.SocketType3, itemdb.SocketType3) as socket_type3,
                COALESCE(itemdb_hf.GemProperties, itemdb.GemProperties) as gem_properties,
                COALESCE(itemdb2_hf.ClassID, itemdb2.ClassID) as class_id,
                COALESCE(itemdb2_hf.SubClassID, itemdb2.SubClassID) as sub_class_id,
                COALESCE(itemdb2_hf.IconFileDataID, itemdb2.IconFileDataID) as icon_file_data_id,
                icon.IconName as icon_name,
                COALESCE(transmogsource_hf.ID, transmogsource.ID) as transmog_appearance_id,
                COALESCE(transmogsource_hf.ItemID, transmogsource.ItemID) as transmog_item_id,
                COALESCE(transmog_itemdb_hf.Display, transmog_itemdb.Display) as transmog_item_name,
                (
                    SELECT GROUP_CONCAT(CONCAT(sp.ID, '::', sp.Description) SEPARATOR '||')
                    FROM web.item_effect AS eff
                    LEFT JOIN web.spell AS sp ON sp.ID = eff.SpellID
                    WHERE eff.ParentItemID = item.itementry
                    AND eff.TriggerType != 5
                    AND sp.Description IS NOT NULL
                    AND sp.Description != ''
                ) as description,
                (
                    SELECT MIN(eff.TriggerType)
                    FROM web.item_effect AS eff
                    WHERE eff.ParentItemID = item.itementry
                    AND eff.TriggerType != 5
                ) as trigger_type
                FROM characters.item_instance AS item
                INNER JOIN characters.characters AS `char` ON item.owner_guid = `char`.guid
                INNER JOIN characters.character_inventory AS inv ON item.guid = inv.item AND inv.bag = 0 AND inv.slot <= 18
                LEFT JOIN web.item_sparse AS itemdb ON itemdb.ID = item.itementry
                LEFT JOIN hotfixes.item_sparse AS itemdb_hf ON itemdb_hf.ID = item.itementry
                LEFT JOIN web.item AS itemdb2 ON itemdb2.ID = item.itementry
                LEFT JOIN hotfixes.item AS itemdb2_hf ON itemdb2_hf.ID = item.itementry
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
                new_item["slot_name"] = get_slot_name(item["inventory_type"])
                equipped_items.append(new_item)

            for item in equipped_items:
                raw = item.get("description") or ""
                parsed_spells = []
                for part in raw.split("||"):
                    if "::" not in part:
                        continue
                    spell_id_str, desc = part.split("::", 1)
                    parsed_spells.append({"spell_id": int(spell_id_str), "description": desc})
 
                resolve_spell_descriptions(parsed_spells, cursor)
                item["description"] = "||".join(sp["description"] for sp in parsed_spells)

            # char info
            cursor.execute(f"""
                SELECT
                    characters.guid,
                    characters.name,
                    characters.race,
                    characters.class,
                    characters.level,
                    characters.chosenTitle as title,
                    COALESCE(title_db_hf.Name, title_db.Name) as title_name,
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

            char_guid = char_info["guid"]  # make sure guid is selected in char query
            char_class_id = char_info["class"]
            char_class_name = get_class_name(char_class_id)
            talent_tabs = load_talents(cursor, char_guid, char_class_id, char_class_name)
            glyphs = load_glyphs(cursor, char_guid, char_class_id, char_class_name)

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
                item["item_set"]
                for item in equipped_items_data
                if item.get("item_set") and item["item_set"] != 0
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
                        if item.get("item_set") == s["ID"]
                    ]
                    equipped_count = len(equipped_set_items)
                    # map InventoryType to equipped item
                    equipped_by_inv_type = {item["inventory_type"]: item for item in equipped_set_items}

                    pieces = [
                        {
                            "item_id": fid,
                            "name": equipped_by_inv_type.get(set_item_inv_types.get(fid), {}).get("item_name")
                                    or set_item_names_by_id.get(fid, f"Item {fid}"),
                            "equipped": set_item_inv_types.get(fid) in equipped_by_inv_type,
                        }
                        for fid in fallback_ids
                    ]
                    item_set_data[s["ID"]] = {
                        "id": s["ID"],
                        "name": s["Name"],
                        "equipped_count": equipped_count,
                        "pieces": pieces,
                        "spells": [
                            {
                                "spell_id": spell["SpellID"],
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
        "char_info": char_info,
        "char_stats": char_stats,
        "equipped_items": equipped_items,
        "item_set_data": item_set_data,
        "average_item_level": compute_average_item_level(equipped_items),
        "char_skills": char_skills,
        "talent_tabs": talent_tabs,
        "glyphs": glyphs,
    }

def load_talents(cursor, char_guid: int, char_class_id: int, char_class_name: str) -> list[dict]:
    """
    Returns all talent tabs for the character's class, with every talent node
    annotated with the character's learned rank (0 if unlearned).
 
    Layout info:
      - tab.order_index  → which of the 3 specs it is (0, 1, 2)
      - talent.tier_id   → row  (0-based, 0 = top)
      - talent.col_index → column (0-based)
    """
 
    # 1. Fetch all talent tabs for this class
    cursor.execute("""
        SELECT
            tt.ID            AS tab_id,
            tt.Name          AS name,
            tt.BackgroundFile AS background_file,
            tt.OrderIndex    AS order_index,
            tt.SpellIconID   AS spell_icon_id
        FROM web.talent_tab AS tt
        WHERE tt.ClassMask & (1 << (%s - 1))
        ORDER BY tt.OrderIndex
    """, (char_class_id,))
    tabs = cursor.fetchall()
 
    if not tabs:
        return []
 
    tab_ids = [t["tab_id"] for t in tabs]
    tab_ids_sql = ",".join(str(i) for i in tab_ids)
 
    # 2. Fetch all talents for those tabs
    cursor.execute(f"""
        SELECT
            t.ID             AS talent_id,
            t.TabID          AS tab_id,
            t.TierID         AS tier_id,
            t.ColumnIndex    AS col_index,
            t.SpellRank1     AS spell_rank1,
            t.SpellRank2     AS spell_rank2,
            t.SpellRank3     AS spell_rank3,
            t.SpellRank4     AS spell_rank4,
            t.SpellRank5     AS spell_rank5,
            t.PrereqTalent1  AS prereq_talent1,
            t.PrereqTalent2  AS prereq_talent2,
            t.PrereqTalent3  AS prereq_talent3,
            t.PrereqRank1    AS prereq_rank1,
            t.PrereqRank2    AS prereq_rank2,
            t.PrereqRank3    AS prereq_rank3,
            sn.Name          AS spell_name,
            sp.Description   AS spell_description,
            icon.IconName    AS icon_name
        FROM web.talent AS t
        LEFT JOIN web.spell_name AS sn  ON sn.ID  = t.SpellRank1
        LEFT JOIN web.spell      AS sp  ON sp.ID  = t.SpellRank1
        LEFT JOIN web.icon_data  AS icon ON icon.DataFileID = (
            SELECT sm.SpellIconFileDataID
            FROM web.spell_misc AS sm
            WHERE sm.SpellID = t.SpellRank1
            LIMIT 1
        )
        WHERE t.TabID IN ({tab_ids_sql})
        ORDER BY t.TabID, t.TierID, t.ColumnIndex
    """)
    all_talents = cursor.fetchall()
 
    # 3. Fetch character's learned talents (active group = 0)
    cursor.execute("""
        SELECT talentId AS talent_id, rank AS learned_rank
        FROM characters.character_talent
        WHERE guid = %s AND talentGroup = 0
    """, (char_guid,))
    learned = {row["talent_id"]: row["learned_rank"] + 1 for row in cursor.fetchall()}
 
    # 4. For each talent, resolve the actual spell ID for the learned rank
    #    SpellRank columns are 1-indexed; rank from DB is 0-based index
    #    e.g. learned_rank=1 → SpellRank1, learned_rank=2 → SpellRank2
    spell_ids_needed = set()
    for talent in all_talents:
        lr = learned.get(talent["talent_id"], 0)
        if lr > 0:
            col = f"spell_rank{lr}"
            sid = talent.get(col)
            if sid:
                spell_ids_needed.add(sid)
 
    # Resolve descriptions for learned rank spells
    spell_desc_map: dict[int, str] = {}

    if spell_ids_needed:
        ids_sql = ",".join(str(i) for i in spell_ids_needed)
        cursor.execute(f"""
            SELECT sp.ID AS spell_id, sp.Description AS description
            FROM web.spell AS sp
            WHERE sp.ID IN ({ids_sql})
        """)
        raw_descs = [{"spell_id": row["spell_id"], "description": row["description"] or ""} for row in cursor.fetchall()]
        resolve_spell_descriptions(raw_descs, cursor)
        spell_desc_map = {r["spell_id"]: r["description"] for r in raw_descs}
 
    # Also resolve base (rank 1) descriptions for unlearned talents tooltip
    base_spell_ids = {t["spell_rank1"] for t in all_talents if t.get("spell_rank1")}
    base_desc_map: dict[int, str] = {}

    if base_spell_ids:
        ids_sql = ",".join(str(i) for i in base_spell_ids)
        cursor.execute(f"""
            SELECT sp.ID AS spell_id, sp.Description AS description
            FROM web.spell AS sp
            WHERE sp.ID IN ({ids_sql})
        """)
        raw_base = [{"spell_id": row["spell_id"], "description": row["description"] or ""} for row in cursor.fetchall()]
        resolve_spell_descriptions(raw_base, cursor)
        base_desc_map = {r["spell_id"]: r["description"] for r in raw_base}
 
    # 5. Build tab → talent grid structure
    talents_by_tab: dict[int, list] = {t["tab_id"]: [] for t in tabs}
    
    for talent in all_talents:
        lr = learned.get(talent["talent_id"], 0)
 
        # max_rank = number of non-null SpellRank columns
        ranks = [
            talent.get(f"spell_rank{i}")
            for i in range(1, 6)
        ]

        # remove invalid / zero
        ranks = [r for r in ranks if r not in (None, 0)]

        # remove duplicates (some DBs repeat spell IDs)
        unique_ranks = []
        for r in ranks:
            if r not in unique_ranks:
                unique_ranks.append(r)

        max_rank = len(unique_ranks)
 
        # Resolved spell for learned rank (for tooltip)
        learned_spell_id = None
        if lr > 0:
            learned_spell_id = talent.get(f"spell_rank{lr}")
 
        talents_by_tab[talent["tab_id"]].append({
            "talent_id":          talent["talent_id"],
            "tier_id":            talent["tier_id"],
            "col_index":          talent["col_index"],
            "max_rank":           max_rank,
            "learned_rank":       lr,
            "spell_name":         (talent["spell_name"] or "").strip('"'),
            "spell_class":        char_class_name,
            "icon_name":          talent["icon_name"] or "",
            # Description shown in tooltip: use learned rank desc if learned, else rank-1 desc
            "spell_description":  (
                spell_desc_map.get(learned_spell_id, "")
                if learned_spell_id
                else base_desc_map.get(talent.get("spell_rank1"), "")
            ),
            "prereqs": [
                {"talent_id": talent[f"prereq_talent{i}"], "rank": talent[f"prereq_rank{i}"]}
                for i in range(1, 4)
                if talent.get(f"prereq_talent{i}")
            ],
        })
 
    return [
        {
            "tab_id":          tab["tab_id"],
            "name":            tab["name"],
            "background_file": tab["background_file"] or "",
            "order_index":     tab["order_index"],
            "spell_icon_id":   tab["spell_icon_id"],
            "talents":         talents_by_tab[tab["tab_id"]],
        }
        for tab in tabs
    ]

def load_glyphs(cursor, char_guid: int, char_class_id: int, char_class_name: str) -> list[dict]:
    """
    Returns the character's 6 glyph slots with spell name, description,
    icon, and glyph type (major/minor).
    GlyphSlotFlags: 0 = major, 1 = minor
    """

    cursor.execute("""
        SELECT
            cg.glyphSlot        AS glyph_slot,
            cg.glyphId          AS glyph_id,
            vgp.SpellID         AS spell_id,
            vgp.GlyphSlotFlags  AS glyph_slot_flags,
            sn.Name             AS spell_name,
            sp.Description      AS spell_description
        FROM characters.character_glyphs cg
        LEFT JOIN web.v_glyph_properties vgp ON vgp.ID = cg.glyphId
        LEFT JOIN web.spell_name sn ON sn.ID = vgp.SpellID
        LEFT JOIN web.spell sp ON sp.ID = vgp.SpellID
        WHERE cg.guid = %s
        ORDER BY cg.glyphSlot
    """, (char_guid,))
    rows = cursor.fetchall()

    # Resolve $variables / token substitution in descriptions
    parsed = [
        {
            "spell_id": row["spell_id"],
            "description": row["spell_description"] or "",
        }
        for row in rows
    ]
    resolve_spell_descriptions(parsed, cursor)
    desc_map = {p["spell_id"]: p["description"] for p in parsed}

    return [
        {
            "glyph_slot":        row["glyph_slot"],
            "glyph_id":          row["glyph_id"],
            "spell_id":          row["spell_id"],
            "glyph_type":        "minor" if row["glyph_slot_flags"] == 1 else "major",
            "glyph_class":       char_class_name,
            "spell_name":        (spell_name := (row["spell_name"] or "").strip('"')),
            "spell_description": desc_map.get(row["spell_id"], ""),
            "icon_name":         GLYPH_ICON_MAP_OVERRIDE.get(spell_name) or GLYPH_ICON_MAP.get(spell_name, ""),
        }
        for row in rows
    ]

def get_glyph_icons(cursor, rows: list[dict], char_class_id: int) -> dict[int, str]:
    """Returns a map of glyph spell_id -> icon_name of the spell it modifies."""
    # SpellClassSet for each class (1-indexed class ID -> SpellClassSet)
    CLASS_TO_SPELL_CLASS_SET = {
        1: 4,   # Warrior
        2: 10,  # Paladin
        3: 9,   # Hunter
        4: 8,   # Rogue
        5: 6,   # Priest
        6: 15,  # Death Knight
        7: 11,  # Shaman
        8: 3,   # Mage
        9: 5,   # Warlock
        11: 7,  # Druid
    }

    spell_class_set = CLASS_TO_SPELL_CLASS_SET.get(char_class_id)
    if not spell_class_set:
        return {}

    icon_map = {}
    for row in rows:
        spell_name = (row["spell_name"] or "").strip('"')
        if not spell_name.startswith("Glyph of "):
            continue
        actual_name = spell_name.removeprefix("Glyph of ")
        cursor.execute("""
            SELECT sn.ID, icd.IconName
            FROM web.spell_name AS sn
            LEFT JOIN web.spell AS sp ON sn.ID = sp.ID
            LEFT JOIN web.spell_class_options AS sco ON sn.ID = sco.SpellID
            LEFT JOIN web.spell_misc AS sm ON sn.ID = sm.SpellID
            LEFT JOIN web.icon_data AS icd ON sm.SpellIconFileDataID = icd.DataFileID
            WHERE (
                    sn.Name = %s
                OR sn.Name = CONCAT('"', %s, '"')
                )
            AND sco.SpellClassSet = %s
            AND sp.Description IS NOT NULL
            AND sp.Description != ''
            ORDER BY LENGTH(sp.Description) DESC, sn.ID ASC
            LIMIT 1
        """, (actual_name, actual_name, spell_class_set))

        result = cursor.fetchone()
        if result and result["IconName"]:
            print(f"Resolved glyph '{spell_name}' to spell ID {result['ID']} with icon '{result['IconName']}'")
            icon_map[row["spell_id"]] = result["IconName"]

    return icon_map

@router.get("/armory/{name}")
def get_armory(name: str):
    data = load_character(name)

    if not data:
        raise HTTPException(status_code=404, detail="Character not found")
    index_character(data)

    return data