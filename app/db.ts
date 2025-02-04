import mysql, { type RowDataPacket } from "mysql2/promise";

const con = mysql.createConnection({
  database: "acore_characters",
  host: "localhost",
  user: "root",
  port: 3310,
  password: "7xd21amf8",
});

interface ArenaPlayer extends RowDataPacket {}

export async function loadArenaLadder(type: number) {
  const db = await con;
  const data = await db.execute<ArenaPlayer[]>(
    `
        SELECT 
    arena_team.arenaTeamId, 
    arena_team.\`name\`,
    arena_team.\`type\`, 
    arena_team.rating, 
    arena_team.seasonGames, 
    arena_team.seasonWins, 
    arena_team.rank, 
    arena_team_member.arenaTeamId,
    arena_team_member.guid,
    arena_team_member.seasonGames,
    arena_team_member.seasonWins,
    characters.guid,
    characters.\`name\`,
    characters.race,
    characters.class,
    characters.gender,
    character_talent.spell
FROM arena_team 
INNER JOIN arena_team_member 
    ON arena_team.arenaTeamId = arena_team_member.arenaTeamId
INNER JOIN characters 
    ON arena_team_member.guid = characters.guid
LEFT JOIN character_talent 
    ON characters.guid = character_talent.guid 
    AND character_talent.spell IN (49028, 49184, 48505, 50334, 65139, 
                                     53270, 53209, 53301, 44425, 44457, 
                                     44572, 53563, 53595, 53385, 47540, 
                                     47788, 47585, 1329, 51690, 51713, 
                                     51490, 51533, 61295, 48181, 59672, 
                                     50796, 46924, 46917, 46968)    
  WHERE \`type\`= ? ORDER BY arena_team.rating DESC;`,
    [type]
  );
  return data[0];
}
