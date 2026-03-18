from langchain_core.tools import tool
from db import query_db
from rag import similarity_search_articles, similarity_search_characters



@tool
def query_auth_db(sql: str) -> str:
    """Execute a SQL query on the auth database. Only SELECT queries are allowed."""
    return query_db("auth", sql)

@tool
def query_characters_db(sql: str) -> str:
    """Execute a SQL query on the characters database. Only SELECT queries are allowed."""
    print(f"Executing query_characters_db with SQL: {sql}")
    return query_db("characters", sql)

@tool
def query_world_db(sql: str) -> str:   
    """Execute a SQL query on the world database. Only SELECT queries are allowed."""
    return query_db("world", sql)

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

tools = [
    query_auth_db,
    query_characters_db,
    query_world_db,
    search_characters_knowledge_base,
    search_articles_knowledge_base,
]