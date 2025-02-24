import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool } from "mysql2";
import type { Generated } from "kysely";

export interface AcoreCharactersDatabase {
  arena_team_member: {
    guid: number;
    arenaTeamId: number;
    seasonWins: number;
    seasonGames: number;
  };
  arena_team: {
    arenaTeamId: number;
    type: number;
    rating: number;
  };
  characters: {
    guid: number;
    name: string;
    race: number;
    class: number;
    gender: number;
  };
  character_talent: {
    guid: number;
    spell: number;
  };
}

export interface AcoreAuthDatabase {
  "acore_auth.account": {
    id: Generated<number>;
    username: string;
    salt: Buffer;
    verifier: Buffer;
    reg_mail: string;
  };
}

const db = new Kysely<AcoreCharactersDatabase & AcoreAuthDatabase>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: "acore_characters",
      host: "localhost",
      user: "root",
      port: 3310,
      password: "7xd21amf8",
    }),
  }),
});

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

export async function loadArenaLadder(
  bracket: number,
  limit: number,
  offset: number
): Promise<ArenaPlayer[]> {
  const validSpells = [
    49028, 49184, 48505, 50334, 65139, 53270, 53209, 53301, 44425, 44457, 44572,
    53563, 53595, 53385, 47540, 47788, 47585, 1329, 51690, 51713, 51490, 51533,
    61295, 48181, 59672, 50796, 46924, 46917, 46968,
  ];

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
