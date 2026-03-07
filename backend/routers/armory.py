from fastapi import APIRouter
from db import get_characters_connection, engines, rows_to_dicts
from sqlalchemy import text

router = APIRouter()

VALID_SPELLS = [
    49028, 49184, 48505, 50334, 65139, 53270, 53209, 53301, 44425, 44457, 44572,
    53563, 53595, 53385, 47540, 47788, 47585, 1329, 51690, 51713, 51490, 51533,
    61295, 48181, 59672, 50796, 46924, 46917, 46968,
]

def load_character(name: str) -> dict:
    valid_spells_sql = ",".join(str(s) for s in VALID_SPELLS)

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
                    SELECT GROUP_CONCAT(sp.Description SEPARATOR '||')
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
                equipped_items.append({**item, "enchantments": enchantments})

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
                        SELECT ct.talentId FROM characters.character_talent ct
                        INNER JOIN web.talent t ON t.ID = ct.talentId
                        WHERE ct.guid = characters.guid
                        AND CAST(t.SpellRank1 AS UNSIGNED) IN ({valid_spells_sql})
                        LIMIT 1
                    ) as talent_id,
                    (
                        SELECT CAST(t.SpellRank1 AS UNSIGNED) FROM characters.character_talent ct
                        INNER JOIN web.talent t ON t.ID = ct.talentId
                        WHERE ct.guid = characters.guid
                        AND CAST(t.SpellRank1 AS UNSIGNED) IN ({valid_spells_sql})
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
                    cs.armor
                FROM characters.characters c
                LEFT JOIN characters.character_stats cs ON cs.guid = c.guid
                WHERE c.name = %s
            """, (name,))
            char_stats = cursor.fetchone()

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
                        f"SELECT ID, Display as name FROM web.item_sparse WHERE ID IN ({','.join(str(i) for i in set_item_ids)})"
                    )
                    set_item_names_by_id = {row["ID"]: row["name"] for row in cursor.fetchall()}

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

                    pieces = [
                        {
                            "itemId": fid,
                            "name": equipped_set_items[idx]["item_name"] if idx < len(equipped_set_items) else set_item_names_by_id.get(fid, f"Item {fid}"),
                            "equipped": idx < len(equipped_set_items),
                        }
                        for idx, fid in enumerate(fallback_ids)
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

    finally:
        conn.close()

    return {
        "charInfo": char_info,
        "charStats": char_stats,
        "equippedItems": equipped_items,
        "itemSetData": item_set_data,
    }

@router.get("/armory/{name}")
def get_armory(name: str):
    return load_character(name)