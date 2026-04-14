import re
from fastapi import APIRouter, HTTPException
from db import get_characters_connection
from rag import index_character
from utils import get_class_name, get_slot_name, get_race_name, compute_average_item_level, resolve_spell_descriptions

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