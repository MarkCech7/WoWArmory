import hashlib
import os
from fastapi import APIRouter, HTTPException
from db import get_auth_connection

router = APIRouter()

# TODO implement Battle net account authentication
def calculate_srp6_verifier(username: str, password: str, salt: bytes) -> bytes:
    N = int("894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7", 16)
    g = 7
    h1 = hashlib.sha1(f"{username.upper()}:{password.upper()}".encode()).digest()
    h2 = hashlib.sha1(salt + h1).digest()
    x = int.from_bytes(h2, byteorder="little")
    verifier = pow(g, x, N)

    return verifier.to_bytes(32, byteorder="little")

def get_srp6_registration_data(username: str, password: str):
    salt = os.urandom(32)
    verifier = calculate_srp6_verifier(username, password, salt)

    return {"salt": salt, "verifier": verifier}

def load_account(username: str):
    conn = get_auth_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, salt, verifier FROM account WHERE username = %s LIMIT 1",
                (username,)
            )
            return cursor.fetchone()
        
    finally:
        conn.close()

def get_user_by_id(user_id: int):
    conn = get_auth_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, username FROM account WHERE id = %s LIMIT 1",
                (user_id,)
            )
            return cursor.fetchone()
        
    finally:
        conn.close()

def insert_account(username: str, salt: bytes, verifier: bytes, reg_email: str):
    conn = get_auth_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO account (username, salt, verifier, reg_mail) VALUES (%s, %s, %s, %s)",
                (username.upper(), salt, verifier, reg_email)
            )
            conn.commit()
            return cursor.lastrowid
        
    finally:
        conn.close()

@router.post("/register")
def register(body: dict):
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()
    email = body.get("email", "").strip()

    if not username or not password or not email:
        raise HTTPException(status_code=400, detail="Missing fields")

    existing = load_account(username.upper())
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    data = get_srp6_registration_data(username, password)
    account_id = insert_account(username, data["salt"], data["verifier"], email)
    
    return {"success": True, "id": account_id}

@router.post("/login")
def login(body: dict):
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing fields")

    account = load_account(username.upper())
    if not account:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    salt = bytes(account["salt"])
    stored_verifier = bytes(account["verifier"])
    computed_verifier = calculate_srp6_verifier(username, password, salt)

    if computed_verifier != stored_verifier:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"success": True, "id": account["id"], "username": account["username"]}