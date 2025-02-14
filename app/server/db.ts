import mysql, { type RowDataPacket } from "mysql2/promise";

const con = mysql.createConnection({
  database: "acore_characters",
  host: "localhost",
  user: "root",
  port: 3310,
  password: "7xd21amf8",
});

interface ArenaPlayer extends RowDataPacket {}

export async function loadArenaLadder(
  bracket: number,
  limit: number,
  offset: number
) {
  const db = await con;
  const data = await db.query<ArenaPlayer[]>(
    `WITH RankedPlayers AS (
    SELECT 
        atm.guid, 
        c.\`name\` AS \`name\`, 
        MAX(at.rating) AS rating, -- Get highest rating per player
        at.\`type\` AS bracket,
        c.race, 
        c.class,
        c.gender, 
        MAX(atm.seasonWins) AS seasonWins, 
        MAX(atm.seasonGames) AS seasonGames,
        DENSE_RANK() OVER (PARTITION BY at.\`type\` ORDER BY MAX(at.rating) DESC) AS \`rank\`
    FROM arena_team_member atm
    INNER JOIN arena_team at ON atm.arenaTeamId = at.arenaTeamId
    INNER JOIN characters c ON atm.guid = c.guid
    GROUP BY atm.guid, c.\`name\`, at.\`type\`, c.race, c.class, c.gender
), 
PlayerCounts AS (
    SELECT 
        at.\`type\` AS bracket, 
        COUNT(DISTINCT atm.guid) AS total_players  
    FROM arena_team_member atm
    INNER JOIN arena_team at ON atm.arenaTeamId = at.arenaTeamId
    GROUP BY at.\`type\`
), 
TitleCutoffs AS (
    SELECT 
        bracket, 
        CEIL(total_players * 0.001) AS Rank1_Cutoff, 
        CEIL(total_players * 0.05) AS Gladiator_Cutoff, 
        CEIL(total_players * 0.10) AS Duelist_Cutoff, 
        CEIL(total_players * 0.30) AS Rival_Cutoff, 
        CEIL(total_players * 0.60) AS Challenger_Cutoff
    FROM PlayerCounts
),
    FinalData AS (
    SELECT 
    rp.guid, 
    rp.\`name\`, 
    rp.rating,  
    rp.bracket,  
    rp.\`rank\`,  
    rp.race,  
    rp.class,
    rp.gender,  
    rp.seasonWins,  
    rp.seasonGames,  
    ct.spell,  -- Only one spell per player
    CASE  
        WHEN rp.rank <= tc.Rank1_Cutoff THEN 'Rank 1' 
        WHEN rp.rank <= tc.Gladiator_Cutoff THEN 'Gladiator' 
        WHEN rp.rank <= tc.Duelist_Cutoff THEN 'Duelist' 
        WHEN rp.rank <= tc.Rival_Cutoff THEN 'Rival' 
        WHEN rp.rank <= tc.Challenger_Cutoff THEN 'Challenger' 
        ELSE 'No Title' 
    END AS title 
FROM RankedPlayers rp
LEFT JOIN character_talent ct ON rp.guid = ct.guid  
   AND ct.spell IN (49028, 49184, 48505, 50334, 65139, 53270, 53209, 53301, 44425, 44457,  
                   44572, 53563, 53595, 53385, 47540, 47788, 47585, 1329, 51690, 51713,  
                   51490, 51533, 61295, 48181, 59672, 50796, 46924, 46917, 46968) 
INNER JOIN TitleCutoffs tc ON rp.bracket = tc.bracket  
WHERE rp.bracket = ? 
)
SELECT *,
    (SELECT COUNT(*) FROM FinalData) AS total_count -- Get total count before pagination
FROM FinalData 
ORDER BY rp.rating DESC, rp.rank LIMIT ? OFFSET ?;`,
    [bracket, limit, offset]
  );
  return data[0];
}

interface Account extends RowDataPacket {
  username: string;
  salt: Uint8Array;
  verifier: Uint8Array;
  id: number;
}

export async function loadAccount(username: string) {
  const db = await con;
  const data = await db.query<Account[]>(
    "SELECT id, username, salt, verifier FROM acore_auth.account WHERE username = ? LIMIT 1",
    [username]
  );
  let x = data[0];
  if (Array.isArray(x) && x.length > 0) {
    return x[0];
  }
  return null;
}

export async function getUserById(id: number) {
  const db = await con;
  const data = await db.query<Account[]>(
    "SELECT id, username FROM acore_auth.account WHERE id = ? LIMIT 1",
    [id]
  );
  let x = data[0];
  if (Array.isArray(x) && x.length > 0) {
    return x[0];
  }
  return null;
}
