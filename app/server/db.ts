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
