import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import type { Generated } from "kysely";
import { CharRace } from "~/components/race";
import { title } from "process";

import type {
  CharactersDatabase,
  AuthDatabase,
  WebDatabase,
  HotfixesDatabase,
} from "./db-types";

// Use a module-scoped variable to ensure the connection is created only once
let dbInstance: Kysely<
  CharactersDatabase & AuthDatabase & WebDatabase & HotfixesDatabase
> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Kysely<
      CharactersDatabase & AuthDatabase & WebDatabase & HotfixesDatabase
    >({
      dialect: new MysqlDialect({
        pool: createPool({
          database: process.env.CHARACTERS_DB,
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          port: Number(process.env.DB_PORT),
          password: process.env.DB_PASSWORD,
          connectionLimit: 10,
        }),
      }),
    });
  }
  return dbInstance;
}

// Export a pre-initialized instance for direct imports
export const db = getDb();

export async function loadAccount(username: string) {
  const result = await db
    .selectFrom("auth.account")
    .select(["id", "username", "salt", "verifier"])
    .where("username", "=", username)
    .limit(1)
    .executeTakeFirst();

  return result || null;
}

export async function getUserById(id: number) {
  const result = await db
    .selectFrom("auth.account")
    .select(["id", "username"])
    .where("id", "=", id)
    .limit(1)
    .executeTakeFirst();

  return result || null;
}

export async function insertAccount(
  username: string,
  salt: Buffer,
  verifier: Buffer,
  reg_email: string,
) {
  const result = await db
    .insertInto("auth.account")
    .values({
      username,
      salt,
      verifier,
      reg_mail: reg_email,
    })
    .executeTakeFirst();

  return result.insertId;
}

interface ArenaPlayer {
  guid: number;
  name: string;
  rating: number;
  bracket: number;
  rank: number;
  race: number;
  class: number;
  gender: number;
  seasonWins: number;
  seasonGames: number;
  spell: number | null;
  title: string;
  total_count: number;
}

const validSpells = [
  49028, 49184, 48505, 50334, 65139, 53270, 53209, 53301, 44425, 44457, 44572,
  53563, 53595, 53385, 47540, 47788, 47585, 1329, 51690, 51713, 51490, 51533,
  61295, 48181, 59672, 50796, 46924, 46917, 46968,
];

export async function loadArenaLadder(
  bracket: number,
  limit: number,
  offset: number,
): Promise<ArenaPlayer[]> {
  const rankedPlayers = db
    .with("RankedPlayers", (db) =>
      db
        .selectFrom("character_arena_stats as cas")
        .innerJoin("characters as c", "cas.guid", "c.guid")
        .select([
          "cas.guid",
          "c.name",
          "cas.personalRating as rating",
          "cas.slot as bracket",
          "c.race",
          "c.class",
          "c.gender",
          "cas.seasonWon as seasonWins",
          "cas.seasonGames",
          sql<number>`DENSE_RANK() OVER (PARTITION BY cas.slot ORDER BY cas.personalRating DESC)`.as(
            "rank",
          ),
        ])
        .where("cas.slot", "=", bracket),
    )
    .with("PlayerCounts", (db) =>
      db
        .selectFrom("character_arena_stats as cas")
        .select([
          "cas.slot as bracket",
          sql<number>`COUNT(DISTINCT cas.guid)`.as("total_players"),
        ])
        .groupBy("cas.slot"),
    )
    .with("TitleCutoffs", (db) =>
      db
        .selectFrom("PlayerCounts")
        .select([
          "bracket",
          sql<number>`CEIL(total_players * 0.001)`.as("Rank1_Cutoff"),
          sql<number>`CEIL(total_players * 0.05)`.as("Gladiator_Cutoff"),
          sql<number>`CEIL(total_players * 0.10)`.as("Duelist_Cutoff"),
          sql<number>`CEIL(total_players * 0.30)`.as("Rival_Cutoff"),
          sql<number>`CEIL(total_players * 0.60)`.as("Challenger_Cutoff"),
        ]),
    )
    .with("FinalData", (db) =>
      db
        .selectFrom("RankedPlayers as rp")
        .innerJoin("TitleCutoffs as tc", "rp.bracket", "tc.bracket")
        .select([
          "rp.guid",
          "rp.name",
          "rp.rating",
          "rp.bracket",
          "rp.rank",
          "rp.race",
          "rp.class",
          "rp.gender",
          "rp.seasonWins",
          "rp.seasonGames",
          sql<number>`(
          SELECT CAST(t.SpellRank1 AS UNSIGNED) FROM character_talent ct
          INNER JOIN web.talent t ON t.ID = ct.talentId
          WHERE ct.guid = rp.guid
          AND CAST(t.SpellRank1 AS UNSIGNED) IN (${sql.join(validSpells)})
          LIMIT 1
        )`.as("spell"),
          sql<string>`CASE
        WHEN rp.rank <= tc.Rank1_Cutoff THEN 'Rank 1'
        WHEN rp.rank <= tc.Gladiator_Cutoff THEN 'Gladiator'
        WHEN rp.rank <= tc.Duelist_Cutoff THEN 'Duelist'
        WHEN rp.rank <= tc.Rival_Cutoff THEN 'Rival'
        WHEN rp.rank <= tc.Challenger_Cutoff THEN 'Challenger'
        ELSE 'No Title'
      END`.as("title"),
        ]),
    );

  const result = await rankedPlayers
    .selectFrom("FinalData")
    .select([
      "guid",
      "name",
      "rating",
      "bracket",
      "rank",
      "race",
      "class",
      "gender",
      "seasonWins",
      "seasonGames",
      "spell",
      "title",
      sql<number>`(SELECT COUNT(*) FROM FinalData)`.as("total_count"),
    ])
    .orderBy("rating", "desc")
    .orderBy("rank")
    .limit(limit)
    .offset(offset)
    .execute();

  console.dir(result, { depth: null });
  return result;
}

export async function loadCharacter() {
  const equippedItemsUnenchant = await db
    .selectFrom("item_instance as item")
    .innerJoin("characters as char", "item.owner_guid", "char.guid")
    .innerJoin("character_inventory as inv", (join) =>
      join
        .onRef("item.guid", "=", "inv.item")
        .on("inv.bag", "=", 0)
        .on("inv.slot", "<=", 18),
    )
    // item_sparse: web + hotfixes
    .leftJoin("web.item_sparse as itemdb", "itemdb.ID", "item.itemEntry")
    .leftJoin(
      "hotfixes.item_sparse as itemdb_hf",
      "itemdb_hf.ID",
      "item.itemEntry",
    )
    // item: web + hotfixes
    .leftJoin("web.item as itemdb2", "itemdb2.ID", "item.itemEntry")
    .leftJoin("hotfixes.item as itemdb2_hf", "itemdb2_hf.ID", "item.itemEntry")
    // item_effect: web + hotfixes
    .leftJoin("web.item_effect as effect", "effect.ParentItemID", "itemdb.ID")
    .leftJoin(
      "hotfixes.item_effect as item_effect_hf",
      "item_effect_hf.ParentItemID",
      "itemdb.ID",
    )
    // spell: web + hotfixes
    .leftJoin("web.spell as spell", "spell.ID", "effect.SpellID")
    // transmog
    .leftJoin(
      "item_instance_transmog as transmog",
      "transmog.itemGuid",
      "item.guid",
    )
    .leftJoin(
      "web.icon_data as icon",
      "icon.DataFileID",
      "itemdb2.IconFileDataID",
    )
    .leftJoin(
      "web.item_modified_appearance as transmogsource",
      "transmogsource.ID",
      "transmog.itemModifiedAppearanceAllSpecs",
    )
    .leftJoin(
      "hotfixes.item_modified_appearance as transmogsource_hf",
      "transmogsource_hf.ID",
      "transmog.itemModifiedAppearanceAllSpecs",
    )
    .leftJoin(
      "web.item_sparse as transmog_itemdb",
      "transmog_itemdb.ID",
      "transmogsource.ItemID",
    )
    .leftJoin(
      "hotfixes.item_sparse as transmog_itemdb_hf",
      "transmog_itemdb_hf.ID",
      "transmogsource_hf.ItemID",
    )
    .select([
      "item.guid as item_guid",
      "item.itemEntry",
      "item.owner_guid as owner",
      "item.enchantments",
      "inv.slot",
      "char.guid as char_guid",

      // item_sparse - prefer hotfixes
      sql<string>`COALESCE(itemdb_hf.Display, itemdb.Display)`.as("item_name"),
      sql<number>`COALESCE(itemdb_hf.OverallQualityID, itemdb.OverallQualityID)`.as(
        "OverallQualityID",
      ),
      sql<number>`COALESCE(itemdb_hf.Flags1, itemdb.Flags1)`.as("Flags1"),
      sql<number>`COALESCE(itemdb_hf.ItemLevel, itemdb.ItemLevel)`.as(
        "ItemLevel",
      ),
      sql<number>`COALESCE(itemdb_hf.InventoryType, itemdb.InventoryType)`.as(
        "InventoryType",
      ),
      sql<number>`COALESCE(itemdb_hf.Resistances1, itemdb.Resistances1)`.as(
        "Resistances1",
      ),
      sql<number>`COALESCE(itemdb_hf.MinDamage1, itemdb.MinDamage1)`.as(
        "MinDamage1",
      ),
      sql<number>`COALESCE(itemdb_hf.MaxDamage1, itemdb.MaxDamage1)`.as(
        "MaxDamage1",
      ),
      sql<number>`COALESCE(itemdb_hf.ItemDelay, itemdb.ItemDelay)`.as(
        "ItemDelay",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusStat1, itemdb.StatModifierBonusStat1)`.as(
        "StatModifierBonusStat1",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusStat2, itemdb.StatModifierBonusStat2)`.as(
        "StatModifierBonusStat2",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusStat3, itemdb.StatModifierBonusStat3)`.as(
        "StatModifierBonusStat3",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusStat4, itemdb.StatModifierBonusStat4)`.as(
        "StatModifierBonusStat4",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusStat5, itemdb.StatModifierBonusStat5)`.as(
        "StatModifierBonusStat5",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusStat6, itemdb.StatModifierBonusStat6)`.as(
        "StatModifierBonusStat6",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusAmount1, itemdb.StatModifierBonusAmount1)`.as(
        "StatModifierBonusAmount1",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusAmount2, itemdb.StatModifierBonusAmount2)`.as(
        "StatModifierBonusAmount2",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusAmount3, itemdb.StatModifierBonusAmount3)`.as(
        "StatModifierBonusAmount3",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusAmount4, itemdb.StatModifierBonusAmount4)`.as(
        "StatModifierBonusAmount4",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusAmount5, itemdb.StatModifierBonusAmount5)`.as(
        "StatModifierBonusAmount5",
      ),
      sql<number>`COALESCE(itemdb_hf.StatModifierBonusAmount6, itemdb.StatModifierBonusAmount6)`.as(
        "StatModifierBonusAmount6",
      ),
      sql<number>`COALESCE(itemdb_hf.MaxDurability, itemdb.MaxDurability)`.as(
        "MaxDurability",
      ),
      sql<number>`COALESCE(itemdb_hf.RequiredLevel, itemdb.RequiredLevel)`.as(
        "RequiredLevel",
      ),
      sql<number>`COALESCE(itemdb_hf.SocketMatchEnchantmentID, itemdb.SocketMatchEnchantmentID)`.as(
        "SocketMatchEnchantmentID",
      ),
      sql<number>`COALESCE(itemdb_hf.AllowableClass, itemdb.AllowableClass)`.as(
        "AllowableClass",
      ),
      sql<number>`COALESCE(itemdb_hf.ItemSet, itemdb.ItemSet)`.as("ItemSet"),
      sql<number>`COALESCE(itemdb_hf.SocketType1, itemdb.SocketType1)`.as(
        "SocketType1",
      ),
      sql<number>`COALESCE(itemdb_hf.SocketType2, itemdb.SocketType2)`.as(
        "SocketType2",
      ),
      sql<number>`COALESCE(itemdb_hf.SocketType3, itemdb.SocketType3)`.as(
        "SocketType3",
      ),
      sql<number>`COALESCE(itemdb_hf.GemProperties, itemdb.GemProperties)`.as(
        "GemProperties",
      ),

      // item - prefer hotfixes
      sql<number>`COALESCE(itemdb2_hf.ClassID, itemdb2.ClassID)`.as("ClassID"),
      sql<number>`COALESCE(itemdb2_hf.SubClassID, itemdb2.SubClassID)`.as(
        "SubClassID",
      ),
      sql<number>`COALESCE(itemdb2_hf.IconFileDataID, itemdb2.IconFileDataID)`.as(
        "IconFileDataID",
      ),

      "icon.IconName",

      // transmog
      sql<number>`COALESCE(transmogsource_hf.ID, transmogsource.ID)`.as(
        "transmog_appearance_id",
      ),
      sql<number>`COALESCE(transmogsource_hf.ItemID, transmogsource.ItemID)`.as(
        "transmog_item_id",
      ),
      sql<string>`COALESCE(transmog_itemdb_hf.Display, transmog_itemdb.Display)`.as(
        "transmog_item_name",
      ),

      "spell.Description",
      sql<number>`COALESCE(item_effect_hf.TriggerType, effect.TriggerType)`.as(
        "TriggerType",
      ),
    ])
    .where("char.name", "=", "Provimsen")
    .orderBy("inv.slot")
    .execute();

  const enchantids = equippedItemsUnenchant.flatMap((item) =>
    item.enchantments
      .split(" ")
      .filter((i: string) => i !== "0" && i !== "")
      .map((i: string) => parseInt(i)),
  );

  const charInfo = await db
    .selectFrom("characters")
    .leftJoin(
      "web.char_titles as title_db",
      "title_db.MaskID",
      "characters.chosenTitle",
    )
    .leftJoin(
      "hotfixes.char_titles as title_db_hf",
      "title_db_hf.MaskID",
      "characters.chosenTitle",
    )
    .leftJoin("guild_member", "characters.guid", "guild_member.guid")
    .leftJoin("guild", "guild.guildid", "guild_member.guildid")
    .select([
      "characters.name",
      "characters.race",
      "characters.class",
      "characters.level",
      "characters.chosenTitle as title",
      sql<string>`COALESCE(title_db_hf.Name, title_db.Name)`.as("actual_title"),
      "guild.name as guild_name",
      sql<number>`(
      SELECT ct.talentId FROM character_talent ct
      INNER JOIN web.talent t ON t.ID = ct.talentId
      WHERE ct.guid = characters.guid
      AND CAST(t.SpellRank1 AS UNSIGNED) IN (${sql.join(validSpells)})
      LIMIT 1
    )`.as("talent_id"),
      sql<string>`(
      SELECT t.SpellRank1 FROM character_talent ct
      INNER JOIN web.talent t ON t.ID = ct.talentId
      WHERE ct.guid = characters.guid
      AND CAST(t.SpellRank1 AS UNSIGNED) IN (${sql.join(validSpells)})
      LIMIT 1
    )`.as("spec"),
    ])
    .where("characters.name", "=", "Provimsen")
    .executeTakeFirstOrThrow();
  console.log("Char Info:", charInfo);

  const charStats = await db
    .selectFrom("characters")
    .innerJoin(
      "character_stats as charstats",
      "characters.guid",
      "charstats.guid",
    )
    .select([
      "health",
      "power1",
      "power2",
      "power3",
      "power4",
      "power5",
      "power6",
      "power7",
      "strength",
      "agility",
      "stamina",
      "intellect",
      "armor",
    ])
    .where("name", "=", "Provimsen")
    .executeTakeFirstOrThrow();

  const enchants = await db
    .selectFrom("web.spell_item_enchantment")
    .select(["Name as name", "ID as id"])
    .where("ID", "in", enchantids)
    .execute();

  const enchantsById: Record<string, { id: number; name: string }> =
    Object.fromEntries(enchants.map((enchant) => [enchant.id, enchant]));

  type EnchantEntry =
    | { index: number; id: number; name: string }
    | { index: number; id?: undefined; name?: undefined };

  const equippedItems = equippedItemsUnenchant.map((item) => {
    const enchantmentEntries: EnchantEntry[] = item.enchantments
      .split(" ")
      .map((i: string, index: number): EnchantEntry => {
        const enchant = enchantsById[i];
        return { index: index / 3, ...enchant };
      });

    return {
      ...item,
      enchantments: enchantmentEntries.filter(
        (i): i is { index: number; id: number; name: string } => !!i.id,
      ),
    };
  });

  // collect all unique non-zero set IDs from equipped items
  const setIds = [
    ...new Set(
      equippedItemsUnenchant
        .map((i) => i.ItemSet)
        .filter((id) => id && id !== 0),
    ),
  ] as number[];

  const itemSets =
    setIds.length > 0
      ? await db
          .selectFrom("web.item_set as iset")
          .select([
            "iset.ID",
            "iset.Name",
            "iset.ItemID1",
            "iset.ItemID2",
            "iset.ItemID3",
            "iset.ItemID4",
            "iset.ItemID5",
            "iset.ItemID6",
            "iset.ItemID7",
            "iset.ItemID8",
            "iset.ItemID9",
            "iset.ItemID10",
            "iset.ItemID11",
            "iset.ItemID12",
            "iset.ItemID13",
            "iset.ItemID14",
            "iset.ItemID15",
            "iset.ItemID16",
            "iset.ItemID17",
          ])
          .where("iset.ID", "in", setIds)
          .execute()
      : [];

  // collect all item IDs referenced by sets so we can look up their names
  const setItemIds = itemSets.flatMap((s) =>
    [
      s.ItemID1,
      s.ItemID2,
      s.ItemID3,
      s.ItemID4,
      s.ItemID5,
      s.ItemID6,
      s.ItemID7,
      s.ItemID8,
      s.ItemID9,
      s.ItemID10,
      s.ItemID11,
      s.ItemID12,
      s.ItemID13,
      s.ItemID14,
      s.ItemID15,
      s.ItemID16,
      s.ItemID17,
    ].filter((id) => id !== 0),
  );

  const setItemNames =
    setItemIds.length > 0
      ? await db
          .selectFrom("web.item_sparse as itemdb")
          .select(["itemdb.ID", "itemdb.Display as name"])
          .where("itemdb.ID", "in", setItemIds)
          .execute()
      : [];

  const setItemNamesById = Object.fromEntries(
    setItemNames.map((i) => [i.ID, i.name]),
  );

  // build structured set info keyed by set ID
  const equippedItemEntries = new Set(
    equippedItemsUnenchant.map((i) => i.itemEntry),
  );

  const itemSetSpells =
    setIds.length > 0
      ? await db
          .selectFrom("web.item_set_spell as iss")
          .innerJoin("web.spell as sp", "sp.ID", "iss.SpellID")
          .select([
            "iss.ID",
            "iss.SpellID",
            "iss.Threshold as threshold",
            "iss.ItemSetID",
            "sp.Description as description",
          ])
          .where("iss.ItemSetID", "in", setIds)
          .orderBy("iss.Threshold", "asc")
          .execute()
      : [];

  const itemSetSpellsBySetId = itemSetSpells.reduce((acc, spell) => {
    if (!acc[spell.ItemSetID]) acc[spell.ItemSetID] = [];
    acc[spell.ItemSetID].push(spell);
    return acc;
  }, {} as Record<number, typeof itemSetSpells>);

  const itemSetData = Object.fromEntries(
    itemSets.map((s) => {
      const fallbackPieceIds = [
        s.ItemID1,
        s.ItemID2,
        s.ItemID3,
        s.ItemID4,
        s.ItemID5,
        s.ItemID6,
        s.ItemID7,
        s.ItemID8,
        s.ItemID9,
        s.ItemID10,
        s.ItemID11,
        s.ItemID12,
        s.ItemID13,
        s.ItemID14,
        s.ItemID15,
        s.ItemID16,
        s.ItemID17,
      ].filter((id) => id !== 0);

      // get all equipped items that belong to this set
      const equippedSetItems = equippedItemsUnenchant.filter(
        (item) => item.ItemSet === s.ID,
      );

      const equippedCount = equippedSetItems.length;

      // match equipped items to fallback slots by index
      const pieces = fallbackPieceIds.map((fallbackId, idx) => {
        const fallbackName =
          setItemNamesById[fallbackId] ?? `Item ${fallbackId}`;
        const equippedMatch = equippedSetItems[idx];

        return {
          itemId: fallbackId,
          name: equippedMatch ? equippedMatch.item_name : fallbackName,
          equipped: !!equippedMatch,
        };
      });

      return [
        s.ID,
        {
          id: s.ID,
          name: s.Name,
          equippedCount,
          pieces,
          spells: (itemSetSpellsBySetId[s.ID] ?? []).map((spell) => ({
            spellId: spell.SpellID,
            threshold: spell.threshold,
            description: spell.description,
            active: equippedCount >= spell.threshold,
          })),
        },
      ];
    }),
  );

  console.dir(equippedItems, { depth: null });
  return { equippedItems, charInfo, charStats, itemSetData };
}
