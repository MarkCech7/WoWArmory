import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import type { Generated } from "kysely";
import { CharRace } from "~/components/race";
import { title } from "process";

import type {
  AcoreCharactersDatabase,
  AcoreAuthDatabase,
  AcoreWorldDatabase,
} from "./db-types";

// Use a module-scoped variable to ensure the connection is created only once
let dbInstance: Kysely<
  AcoreCharactersDatabase & AcoreAuthDatabase & AcoreWorldDatabase
> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Kysely<
      AcoreCharactersDatabase & AcoreAuthDatabase & AcoreWorldDatabase
    >({
      dialect: new MysqlDialect({
        pool: createPool({
          database: "acore_characters",
          host: "localhost",
          user: "root",
          port: 3310,
          password: "7xd21amf8",
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
    .selectFrom("acore_auth.account")
    .select(["id", "username", "salt", "verifier"])
    .where("username", "=", username)
    .limit(1)
    .executeTakeFirst();

  return result || null;
}

export async function getUserById(id: number) {
  const result = await db
    .selectFrom("acore_auth.account")
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
  reg_email: string
) {
  const result = await db
    .insertInto("acore_auth.account")
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
  offset: number
): Promise<ArenaPlayer[]> {
  const rankedPlayers = db
    .with("RankedPlayers", (db) =>
      db
        .selectFrom("arena_team_member as atm")
        .innerJoin("arena_team as at", "atm.arenaTeamId", "at.arenaTeamId")
        .innerJoin("characters as c", "atm.guid", "c.guid")
        .select([
          "atm.guid",
          "c.name",
          sql<number>`MAX(at.rating)`.as("rating"),
          "at.type as bracket",
          "c.race",
          "c.class",
          "c.gender",
          sql<number>`MAX(atm.seasonWins)`.as("seasonWins"),
          sql<number>`MAX(atm.seasonGames)`.as("seasonGames"),
          sql<number>`DENSE_RANK() OVER (PARTITION BY at.type ORDER BY MAX(at.rating) DESC)`.as(
            "rank"
          ),
        ])
        .groupBy([
          "atm.guid",
          "c.name",
          "at.type",
          "c.race",
          "c.class",
          "c.gender",
        ])
    )
    .with("PlayerCounts", (db) =>
      db
        .selectFrom("arena_team_member as atm")
        .innerJoin("arena_team as at", "atm.arenaTeamId", "at.arenaTeamId")
        .select([
          "at.type as bracket",
          sql<number>`COUNT(DISTINCT atm.guid)`.as("total_players"),
        ])
        .groupBy("at.type")
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
        ])
    )
    .with("FinalData", (db) =>
      db
        .selectFrom("RankedPlayers as rp")
        .leftJoin("character_talent as ct", (join) =>
          join
            .onRef("rp.guid", "=", "ct.guid")
            .on("ct.spell", "in", validSpells)
        )
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
          "ct.spell",
          sql<string>`CASE
            WHEN rp.rank <= tc.Rank1_Cutoff THEN 'Rank 1'
            WHEN rp.rank <= tc.Gladiator_Cutoff THEN 'Gladiator'
            WHEN rp.rank <= tc.Duelist_Cutoff THEN 'Duelist'
            WHEN rp.rank <= tc.Rival_Cutoff THEN 'Rival'
            WHEN rp.rank <= tc.Challenger_Cutoff THEN 'Challenger'
            ELSE 'No Title'
          END`.as("title"),
        ])
        .where("rp.bracket", "=", bracket)
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
        .on("inv.slot", "<=", 18)
    )
    .innerJoin(
      "acore_world.item_template as itemdb",
      "item.itemEntry",
      "itemdb.entry"
    )
    .leftJoin(
      "acore_world.db_spell_12340 as spelldb",
      "itemdb.spellid_1",
      "spelldb.id"
    )
    .innerJoin(
      "acore_world.db_itemdisplayinfo_12340 as itemdisplay",
      "itemdb.displayid",
      "itemdisplay.id"
    )
    .leftJoin(
      "custom_transmogrification as transmog",
      "item.guid",
      "transmog.guid"
    )
    .leftJoin(
      "acore_world.item_template as fake_itemdb",
      "transmog.fakeentry",
      "fake_itemdb.entry"
    )
    .select([
      "item.guid as item_guid",
      "item.itemEntry",
      "item.owner_guid as owner",
      "item.enchantments",
      "inv.slot",
      "char.guid as char_guid",
      "itemdb.name as item_name",
      "fake_itemdb.name as transmogrifyId",
      "itemdb.quality",
      "itemdb.flags",
      "itemdb.itemlevel",
      "itemdb.class",
      "itemdb.subclass",
      "itemdb.inventorytype",
      "itemdb.armor",
      "itemdb.dmg_min1",
      "itemdb.dmg_max1",
      "itemdb.delay",
      "itemdb.stat_type1",
      "itemdb.stat_type2",
      "itemdb.stat_type3",
      "itemdb.stat_type4",
      "itemdb.stat_type5",
      "itemdb.stat_type6",
      "itemdb.stat_value1",
      "itemdb.stat_value2",
      "itemdb.stat_value3",
      "itemdb.stat_value4",
      "itemdb.stat_value5",
      "itemdb.stat_value6",
      "itemdb.maxdurability",
      "itemdb.requiredlevel",
      "itemdb.socketbonus",
      "itemdb.allowableclass",
      "itemdb.displayid as item_displayid",
      "itemdb.spellid_1",
      "itemdb.spellid_2",
      "itemdb.spellid_3",
      "itemdb.spellid_4",
      "itemdb.spellid_5",
      "itemdb.spelltrigger_1",
      "itemdb.spelltrigger_2",
      "itemdb.spelltrigger_3",
      "itemdb.spelltrigger_4",
      "itemdb.spelltrigger_5",
      "itemdb.spellcooldown_1",
      "itemdb.spellcooldown_2",
      "itemdb.spellcooldown_3",
      "itemdb.spellcooldown_4",
      "itemdb.spellcooldown_5",
      "itemdb.itemset",
      "itemdb.socketcolor_1",
      "itemdb.socketcolor_2",
      "itemdb.socketcolor_3",
      "itemdb.gemproperties",
      "itemdisplay.inventoryicon_1 as item_icon",
      "spelldb.Description_lang_enUS as spell_description",
    ])
    .where("char.name", "like", `Provimsen`)
    .orderBy("inv.slot")
    .execute();

  const enchantids = equippedItemsUnenchant.flatMap((item) =>
    item.enchantments
      .split(" ")
      .filter((i) => i !== "0" && i !== "")
      .map((i) => parseInt(i))
  );

  const charInfo = await db
    .selectFrom("characters")
    .innerJoin(
      "acore_world.db_chartitles_12340 as title_db",
      "title_db.mask_id",
      "characters.chosenTitle"
    )
    .innerJoin("character_talent", "characters.guid", "character_talent.guid")
    .innerJoin("guild_member", "characters.guid", "guild_member.guid")
    .innerJoin("guild", "guild_member.guildid", "guild.guildid")
    .select([
      "characters.name",
      "characters.race",
      "characters.class",
      "characters.level",
      "characters.chosenTitle as title",
      "title_db.name_lang_enUS as actual_title",
      "character_talent.spell as spec",
      "guild.name as guild_name",
    ])
    .where("characters.name", "like", `Provimsen`)
    .where("character_talent.spell", "in", validSpells)
    .executeTakeFirstOrThrow();

  const charStats = await db
    .selectFrom("characters")
    .innerJoin(
      "character_stats as charstats",
      "characters.guid",
      "charstats.guid"
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
      "spirit",
      "armor",
    ])
    .where("characters.name", "like", `Provimsen`)
    .executeTakeFirstOrThrow();

  const enchants = await db
    .selectFrom("acore_world.db_spellitemenchantment_12340")
    .select(["name_lang_enUS as name", "id"])
    .where("id", "in", enchantids)
    .execute();

  const enchantsById = Object.fromEntries(
    enchants.map((enchant) => [enchant.id, enchant])
  );

  const equippedItems = equippedItemsUnenchant.map((item) => {
    return {
      ...item,
      enchantments: item.enchantments
        .split(" ")
        .map((i, index) => {
          return { index: index / 3, ...enchantsById[i] };
        })
        .filter((i) => i.id),
    };
  });

  console.dir(equippedItems, { depth: null });
  return { equippedItems, charInfo, charStats };
}
