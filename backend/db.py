import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

HOST = os.getenv("DB_HOST")
PORT = os.getenv("DB_PORT")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")

def make_engine(db_name: str):
    url = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{db_name}"
    return create_engine(url)

engines = {
    "auth":       make_engine(os.getenv("AUTH_DB", "auth")),
    "characters": make_engine(os.getenv("CHARACTERS_DB", "characters")),
    "world":      make_engine(os.getenv("WORLD_DB", "world")),
    "web":        make_engine(os.getenv("WEB_DB", "web")),
}

def query_db(db: str, sql: str) -> str:
    if db not in engines:
        return f"Unknown database '{db}'. Choose from: auth, characters, world, web."
    
    if not sql.strip().upper().startswith("SELECT"):
        return "Only SELECT queries are allowed."
    
    try:
        with engines[db].connect() as conn:
            result = conn.execute(text(sql))
            rows = result.fetchall()
            cols = result.keys()

            if not rows:
                return "No results found."

            lines = [" | ".join(str(col) for col in cols)]
            lines += [" | ".join(str(val) for val in row) for row in rows[:20]]
            if len(rows) > 20:
                lines.append(f"... and {len(rows) - 20} more rows")
            return "\n".join(lines)
    
    except Exception as e:
        return f"DB Error: {str(e)}"