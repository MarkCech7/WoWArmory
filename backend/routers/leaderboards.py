from fastapi import APIRouter
from db import get_characters_connection, VALID_SPELLS

router = APIRouter()

def load_arena_ladder(bracket: int, limit: int, offset: int):
    conn = get_characters_connection()
    try:
        with conn.cursor() as cursor:
            valid_spells_sql = ",".join(str(s) for s in VALID_SPELLS)
            cursor.execute(f"""
                WITH RankedPlayers AS (
                    SELECT
                        cas.guid,
                        c.name,
                        cas.personalRating AS rating,
                        cas.slot AS bracket,
                        c.race,
                        c.class,
                        c.gender,
                        cas.seasonWon AS seasonWins,
                        cas.seasonGames,
                        DENSE_RANK() OVER (PARTITION BY cas.slot ORDER BY cas.personalRating DESC) AS rank
                    FROM character_arena_stats AS cas
                    INNER JOIN characters AS c ON cas.guid = c.guid
                    WHERE cas.slot = %s
                ),
                PlayerCounts AS (
                    SELECT
                        cas.slot AS bracket,
                        COUNT(DISTINCT cas.guid) AS total_players
                    FROM character_arena_stats AS cas
                    GROUP BY cas.slot
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
                        rp.name,
                        rp.rating,
                        rp.bracket,
                        rp.rank,
                        rp.race,
                        rp.class,
                        rp.gender,
                        rp.seasonWins,
                        rp.seasonGames,
                        (
                            SELECT CAST(t.SpellRank1 AS UNSIGNED)
                            FROM character_talent ct
                            INNER JOIN web.talent t ON t.ID = ct.talentId
                            WHERE ct.guid = rp.guid
                            AND CAST(t.SpellRank1 AS UNSIGNED) IN ({valid_spells_sql})
                            LIMIT 1
                        ) AS spell,
                        CASE
                            WHEN rp.rank <= tc.Rank1_Cutoff THEN 'Rank 1'
                            WHEN rp.rank <= tc.Gladiator_Cutoff THEN 'Gladiator'
                            WHEN rp.rank <= tc.Duelist_Cutoff THEN 'Duelist'
                            WHEN rp.rank <= tc.Rival_Cutoff THEN 'Rival'
                            WHEN rp.rank <= tc.Challenger_Cutoff THEN 'Challenger'
                            ELSE 'No Title'
                        END AS title
                    FROM RankedPlayers AS rp
                    INNER JOIN TitleCutoffs AS tc ON rp.bracket = tc.bracket
                )
                SELECT
                    guid,
                    name,
                    rating,
                    bracket,
                    rank,
                    race,
                    class,
                    gender,
                    seasonWins,
                    seasonGames,
                    spell,
                    title,
                    (SELECT COUNT(*) FROM FinalData) AS total_count
                FROM FinalData
                ORDER BY rating DESC, rank
                LIMIT %s OFFSET %s
            """, (bracket, limit, offset))
            return cursor.fetchall()
    finally:
        conn.close()

@router.get("/arenaladder/{bracket}")
def arena_ladder(bracket: int, limit: int = 100, offset: int = 0):
    return load_arena_ladder(bracket, limit, offset)