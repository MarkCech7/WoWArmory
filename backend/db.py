import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("DB_HOST")
PORT = int(os.getenv("DB_PORT"))
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
    
def query_web_db(sql: str, raw: bool = False) -> str | list[dict]:
    try:
        conn = get_web_connection()
        with conn.cursor() as cursor:
            cursor.execute(sql)
            rows = cursor.fetchall()

            if not rows:
                return [] if raw else "No results found."

            if raw:
                return rows

            lines = [" | ".join(str(v) for v in rows[0].keys())]
            lines += [" | ".join(str(v) for v in row.values()) for row in rows[:20]]
            if len(rows) > 20:
                lines.append(f"... and {len(rows) - 20} more rows")
            return "\n".join(lines)

    except Exception as e:
        return [] if raw else f"DB Error: {str(e)}"

def get_auth_connection():
    return pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=os.getenv("AUTH_DB"),
        cursorclass=pymysql.cursors.DictCursor
    )

def get_characters_connection():
    return pymysql.connect(
        host=HOST,
        port=PORT,
        user=USER,
        password=PASSWORD,
        database=os.getenv("CHARACTERS_DB"),
        cursorclass=pymysql.cursors.DictCursor
    )

def get_web_connection():
    return pymysql.connect(
        host=HOST,
        port=PORT,
        user=os.getenv("LLM_USER",),
        password=os.getenv("LLM_USER_PASSWORD"),
        database=os.getenv("WEB_DB"),
        cursorclass=pymysql.cursors.DictCursor
    )