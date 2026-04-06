from fastapi import APIRouter
from db import get_characters_connection
from utils import get_class_name

router = APIRouter()

def load_arena_ladder(bracket: int, limit: int, offset: int):
    conn = get_characters_connection()
    try:
        with conn.cursor() as cursor:
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
                        cas.seasonWon AS season_wins,
                        cas.seasonGames AS season_games,
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
                        rp.season_wins,
                        rp.season_games,
                        (
                            SELECT tt.Name
                            FROM character_talent ct
                            INNER JOIN web.talent t ON t.ID = ct.TalentID
                            INNER JOIN web.talent_tab tt ON tt.ID = t.TabID
                            WHERE ct.guid = rp.guid
                            AND ct.TalentGroup = 0
                            GROUP BY tt.ID, tt.Name
                            ORDER BY SUM(ct.Rank + 1) DESC
                            LIMIT 1
                        ) AS spec_name,
                        (
                            SELECT tt.ID
                            FROM character_talent ct
                            INNER JOIN web.talent t ON t.ID = ct.TalentID
                            INNER JOIN web.talent_tab tt ON tt.ID = t.TabID
                            WHERE ct.guid = rp.guid
                            AND ct.TalentGroup = 0
                            GROUP BY tt.ID
                            ORDER BY SUM(ct.Rank + 1) DESC
                            LIMIT 1
                        ) AS spec,
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
                    season_wins,
                    season_games,
                    spec,
                    spec_name,
                    title,
                    (SELECT COUNT(*) FROM FinalData) AS total_count
                FROM FinalData
                ORDER BY rating DESC, rank
                LIMIT %s OFFSET %s
            """, (bracket, limit, offset))
            char_info = cursor.fetchall()
            for row in char_info:
                row["class_name"] = get_class_name(row["class"])
                row["spec_name"] = row["spec_name"] or ""
                row["spec"] = row["spec"] or ""     

            return char_info
        
    finally:
        conn.close()

@router.get("/arenaladder/{bracket}")
def arena_ladder(bracket: int, limit: int = 100, offset: int = 0):
    return load_arena_ladder(bracket, limit, offset)