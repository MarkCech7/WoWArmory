from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_ollama import ChatOllama
from dotenv import load_dotenv
from db import query_web_db, get_web_connection
from rag import similarity_search_articles, similarity_search_characters
from utils import CLASS_NAMES, RACE_NAMES, HORDE_RACES, ALLIANCE_RACES, resolve_single_spell_description
import os, math

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

llm = ChatOllama(
    model=os.getenv("MODEL"),
    base_url=os.getenv("MODEL_BASE_URL")
)

parser = StrOutputParser()

existing_character_prompt = ChatPromptTemplate.from_template(
    "Generate a short, friendly two-sentence message to the user which will exactly include, that you (chatbot) does not have access to provide information about characters such as gear, stats, talents etc."
    "and that user can visit character '{name}' armory page. Do not include any URL. Just the message, nothing else."
)

non_existing_character_prompt = ChatPromptTemplate.from_template(
    "Generate a short, friendly two-sentence message to the user which will exactly include, that you (chatbot) does not have access to provide information about characters such as gear, stats, talents etc."
    "and that user can visit armory page and search for characters. Do not include any URL. Just the message, nothing else."
)

arena_leaderboards_prompt = ChatPromptTemplate.from_template(
    "Generate a short, friendly two-sentence message to the user which will exactly include, that you does not have access to provide information about arena statistics."
    "and that user can visit arena leaderboards pages. Do not include any URL. Just the message, nothing else. Query: {query}"
)

spell_intro_prompt = ChatPromptTemplate.from_template(
    "Generate exactly one short, friendly sentence to introduce a spell tooltip. "
    "Examples: 'Sure! here is the spell tooltip.', 'Here you go!', 'Let me show you that spell.', 'Here is what I found!'. "
    "Output only the sentence."
)

character_found_chain = existing_character_prompt | llm | parser
character_not_found_chain = non_existing_character_prompt | llm | parser
arena_leaderboards_chain = arena_leaderboards_prompt | llm | parser
spell_intro_chain = spell_intro_prompt | llm | parser

@tool
def list_characters_by_class(class_name: str) -> str:
    """
    List characters by class name. Use this when the user asks for players of a specific class.
    Example: "give me list of paladins" or "show me all mages"
    Input must be a class name string like "Paladin", "Mage", "Warrior" etc.
    """
    class_id = next(    
        (id for id, name in CLASS_NAMES.items() if name.lower() == class_name.lower().strip()),
        None
    )

    if class_id is None:
         return f"Unknown class '{class_name}'."
    
    count = query_web_db(f"SELECT COUNT(*) as count FROM web.characters_public WHERE class = {class_id}")
    characters = query_web_db(f"SELECT name FROM web.characters_public WHERE class = {class_id} LIMIT 20")

    return f"{class_name} count:\n{count}\n\n{class_name} characters:\n{characters}"

@tool
def list_characters_by_race(race_name: str) -> str:
    """
    List characters by race name. Use this when the user asks for players of a specific race.
    Example: "give me list of human characters" or "show me all undead characters"
    Input must be a race name string like "Human", "Night Elf", "Orc", "Blood Elf" etc.
    """
    RACE_ALIASES = {
        "nelf": "Night Elf",
        "nightelf": "Night Elf",
        "belf": "Blood Elf",
        "bloodelf": "Blood Elf",
    }

    normalized = RACE_ALIASES.get(race_name.lower().strip(), race_name)

    race_id = next(
        (id for id, name in RACE_NAMES.items() if name.lower() == normalized.lower().strip()),
        None
    )

    if race_id is None:
        return f"Unknown race '{race_name}'. Valid races are: {', '.join(RACE_NAMES.values())}"

    count = query_web_db(f"SELECT COUNT(*) as count FROM web.characters_public WHERE race = {race_id}")
    characters = query_web_db(f"SELECT name FROM web.characters_public WHERE race = {race_id} LIMIT 20")

    return f"{normalized} count:\n{count}\n\n{normalized} characters:\n{characters}"

@tool
def list_characters_by_level(query: str) -> str:
    """
    List characters by level. Use this when the user asks for players of a specific level.
    Example: "Give me characters which are level 75.", "How many players are above level 65?", "List players at exactly level 80."
    Input must be a string like "75", "above 65", "exactly 80".
    """
    query_lower = query.lower().strip()

    if "above" in query_lower or "over" in query_lower or "higher" in query_lower or ">" in query_lower:
        level = int(''.join(filter(str.isdigit, query_lower)))
        sql = f"SELECT name, level FROM web.characters_public WHERE level > {level} LIMIT 20"
    elif "below" in query_lower or "under" in query_lower or "lower" in query_lower or "<" in query_lower:
        level = int(''.join(filter(str.isdigit, query_lower)))
        sql = f"SELECT name, level FROM web.characters_public WHERE level < {level} LIMIT 20"
    else:
        level = int(''.join(filter(str.isdigit, query_lower)))
        sql = f"SELECT name, level FROM web.characters_public WHERE level = {level} LIMIT 20"
    
    return query_web_db(sql)

@tool
def get_faction_characters(query: str) -> str:
    """
    Get total count of characters belonging to selected faction. Use this when the user asks how many horde/alliance characters exists.
    Example: "How many horde characters are created on server?"
    Input must be a faction string: "horde" or "alliance"
    """
    query_lower = query.lower()
    alliance_ids = ",".join(str(r) for r in ALLIANCE_RACES)
    horde_ids = ",".join(str(r) for r in HORDE_RACES)

    if "alliance" in query_lower and "horde" not in query_lower:
        result = query_web_db(f"SELECT COUNT(*) as count FROM web.characters_public WHERE race IN ({alliance_ids})")

        return f"Alliance: {result}"
    
    elif "horde" in query_lower and "alliance" not in query_lower:
        result = query_web_db(f"SELECT COUNT(*) as count FROM web.characters_public WHERE race IN ({horde_ids})")

        return f"Horde: {result}"
    
    else:
        alliance = query_web_db(f"SELECT COUNT(*) as count FROM web.characters_public WHERE race IN ({alliance_ids})")
        horde = query_web_db(f"SELECT COUNT(*) as count FROM web.characters_public WHERE race IN ({horde_ids})")

        return f"Alliance: {alliance}\nHorde: {horde}"

@tool
def get_list_of_guilds(query: str) -> str:
    """
    List guilds on the server. Use this when the user asks for list of guilds or guild count.
    Example: "Give me list of all guilds" or "how many guilds are there?"
    """
    count = query_web_db("SELECT COUNT(*) as count FROM web.guilds_public")
    guilds = query_web_db("SELECT name FROM web.guilds_public LIMIT 20")

    return f"Total guilds:\n{count}\n\nGuild list:\n{guilds}"

@tool
def get_characters_with_highest_hk(limit: int = 10) -> str:
    """
    Find a character with most honorable kills  and return its name.
    Use this when user asks who has the most kills or highest HK count.
    """
    result = query_web_db(f"""
        SELECT 
            name, 
            totalKills
        FROM web.characters_public
        ORDER BY totalKills DESC
        LIMIT {limit}
    """)

    return result

@tool
def search_articles_knowledge_base(query: str) -> str:
    """
    Search the WoW server base using semantic similarity.
    Use this when the user asks general questions about:
    - highest rated players, guilds with most members
    - anything that needs fuzzy/semantic search rather than exact SQL
    Example: "who was highest rated restoration druid in season 2?" or "which guild has the most members?" or "Give me information about latest article." or "Give me brief summary of latest server news."
    """
    return similarity_search_articles(query)

@tool  
def search_characters_knowledge_base(query: str) -> str:
    """
    Search indexed character profiles only.
    Use this ONLY when asked about a specific player's gear, stats, item level, 
    title, guild, or specialization.
    Do NOT use this for news, patch notes, or server announcements.
    Input must be a plain text search query string, for example: "Provimsen items"
    """
    return similarity_search_characters(query)

@tool
def calculate_arena_points(rating: int) -> str:
    """
    Calculate weekly arena points for a given rating using the TBC Classic Season 4/WotLK Classic formula.
    Use this when the user asks how many arena points they will get for a specific rating.
    Example: "how many arena points will I get at 1800 rating?" or "calculate points for 2200 rating"
    Input must be an integer rating value.
    """
    TWOS_MOD = 0.76
    THREES_MOD = 0.88
    FIVES_MOD = 1.0

    def calculate_points(rating: int) -> float:
        if rating == 0:
            return 0
        elif rating >= 100:
            return (1022 / (1 + 123 * (math.e ** (-0.00412 * rating)))) + 580
        else:
            return 0.1 * rating + 294

    base_points = calculate_points(rating)

    two_points = math.ceil(base_points * TWOS_MOD)
    three_points = math.ceil(base_points * THREES_MOD)
    five_points = math.ceil(base_points * FIVES_MOD)

    return (
        f"rating | 2v2 | 3v3 | 5v5\n"
        f"{rating} | {two_points} | {three_points} | {five_points}"
    )

@tool(return_direct=True)
def get_character_armory_url(name: str) -> str:
    """
    Get the armory URL for a character by name if characters exists in database.
    Use this when the user asks to look up, find, or view a character's armory page.
    Example: "show me Provimsen's armory" or "Show me gear of player named Fegedin"
    Input must be the character name string.
    """
    result = query_web_db(f"""
        SELECT name FROM web.characters_public 
        WHERE name = '{name}' 
        LIMIT 1
    """)

    if not result or result == "No results found.":
        phrase = character_not_found_chain.invoke({"name": name})

        return f"{phrase}\nPlease try to search for a character <a href=\"/armory/\" target=\"_blank\">here</a>."

    phrase = character_found_chain.invoke({"name": name})

    return f"{phrase}\nTo view {name}'s armory click <a href=\"/armory/{name}\" target=\"_blank\">here</a>."

@tool(return_direct=True)
def get_arena_leaderboards_url(query: str) -> str:
    """
    Get the arena leaderboards URLs.
    Use this when the user asks to look up, find, or view a character's arena statistics, ratings or scores.
    Example: "Who is highest rated player in 3v3 right now?" or "Are there PvP active on the server?"   
    """
    phrase = arena_leaderboards_chain.invoke({"query": query})
     
    return f"{phrase}\nYou can visit leaderboards here: <a href=\"/leaderboards/2v2\" target=\"_blank\">2v2 Arena Ladder</a>, <a href=\"/leaderboards/3v3\" target=\"_blank\">3v3 Arena Ladder</a>"

@tool(return_direct=True)
def get_spell_description(query: str) -> str:
    """
    Get the description for a spell by name.
    Use this when the user asks for information about a specific spell.
    Example: "What does Shadow Bolt do?" or "Describe the spell Fireball."
    Input must be the spell name string.
    """
    for word in ["ability", "spell", "description"]:
        query = query.replace(word, "").strip()

    name_result = query_web_db(f"""
        SELECT `Name` FROM web.spell_name
        WHERE LOWER(`Name`) = LOWER('"{query}"')
        OR LOWER(`Name`) = LOWER('{query}')
        LIMIT 1
    """, raw=True)

    if not name_result:
        return f"Could not find spell: {query}"

    actual_name = name_result[0]["Name"]

    result = query_web_db(f"""
        SELECT sn.ID, sp.`Description`, icd.`IconName`
        FROM web.spell_name AS sn
        LEFT JOIN web.spell AS sp ON sn.ID = sp.ID
        LEFT JOIN web.spell_class_options AS sco ON sn.ID = sco.SpellID
        LEFT JOIN web.spell_misc AS sm ON sn.ID = sm.SpellID
        LEFT JOIN web.icon_data as icd ON sm.SpellIconFileDataID = icd.DataFileID
        WHERE sn.`Name` = '{actual_name}'
          AND sco.`SpellClassSet` IN (3, 4, 5, 6, 7, 8, 9, 10, 11, 15)
          AND sp.`Description` IS NOT NULL
          AND sp.`Description` != ''
        ORDER BY LENGTH(sp.`Description`) DESC, sn.ID ASC
        LIMIT 1
    """, raw=True)

    if not result:
        return f"Could not find spell: {query}"

    row = result[0]
    spell_id = row["ID"]
    description = row["Description"]
    icon = row["IconName"]

    conn = get_web_connection()
    try:
        with conn.cursor() as cursor:
            description = resolve_single_spell_description(spell_id, description, cursor)
    finally:
        conn.close()

    display_name = actual_name.strip('"')

    intro = spell_intro_chain.invoke({})
    return f"{intro}\nSPELL:{icon}|{display_name}|{description}"

tools = [
    list_characters_by_class,
    list_characters_by_race,
    list_characters_by_level,
    get_faction_characters,
    get_list_of_guilds,
    get_characters_with_highest_hk,
    search_characters_knowledge_base,   
    search_articles_knowledge_base,
    calculate_arena_points,
    get_character_armory_url,
    get_arena_leaderboards_url,
    get_spell_description,
]

if __name__ == "__main__":
    loc = get_spell_description.invoke({"query": "Curse of Agony"})
    print(loc)