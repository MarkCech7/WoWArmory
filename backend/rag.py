from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document
from langchain_chroma import Chroma
from db import query_db
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

embeddings = OllamaEmbeddings(   
    model=os.getenv("MODEL"),
    base_url=os.getenv("MODEL_BASE_URL")
)

articles_vectorstore = Chroma(
    collection_name="articles",
    embedding_function=embeddings,
    persist_directory="./chroma_db_articles"
)

characters_vectorstore = Chroma(
    collection_name="characters", 
    embedding_function=embeddings,
    persist_directory="./chroma_db_characters"
)

def index_web_articles():
    documents = []
    articles = query_db("web", "SELECT name, text FROM web_article")
    print(articles)
    lines = articles.split("\n")
    print(f"Indexing {len(lines) - 1} articles.")

    for line in lines[1:]:  # skip header
        line = line.strip()
        if not line:
            continue

        parts = line.split(" | ", 1)
        if len(parts) < 2:
            print(f"Skipping malformed line: {line}")
            continue

        name, text = parts
        documents.append(Document(
            page_content=text,
            metadata={"title": name}
        ))

    if documents:
        try:
            articles_vectorstore.add_documents(documents)
            print(f"Indexed {len(documents)} documents into ChromaDB.")
        except Exception as e:
            print(f"Error indexing: {e}")
    else:
        print("No documents to index.")

def index_character(data: dict):
    info = data["charInfo"]
    stats = data["charStats"]
    items = data["equippedItems"]
    selected_title = info.get("actual_title")
    name = info['name']

    avg_ilvl = round(sum(i["ItemLevel"] for i in items) / len(items))

    title_text = f"{name}'s title is {selected_title.replace('%s', "").strip()}" if selected_title else f"{name} does not have a selected title"

    text = f"""{name} is a level {info['level']} {info['race_name']} {info['spec_name']} {info['class_name']}.
    {name} is a member of the guild {info['guild_name']}.
    {title_text}
    {name}'s average item level is {avg_ilvl}.
    {name}'s stats: Health {stats['health']}, Strength {stats['strength']}, Stamina {stats['stamina']}, Agility {stats['agility']}, Intellect {stats['intellect']}, Armor {stats['armor']}.

    {name}'s equipped items:
    """ + "\n".join(
            f"  {name}'s {i['slot_name']}: {i['item_name']} (item level {i['ItemLevel']})"
            for i in items
        )

    doc = Document(
        page_content=text,
        metadata={"type": "character", "name": name}
    )

    existing = characters_vectorstore.get(where={"name": name})
    if existing and existing["ids"]:
        characters_vectorstore.delete(ids=existing["ids"])

    characters_vectorstore.add_documents([doc])
    print(f"Indexed character: {name}")

def similarity_search_articles(query: str, k: int = 5) -> str:
    results = articles_vectorstore.similarity_search(query, k=k)

    if not results:
        return "No relevant articles found."

    return "\n\n".join([
        f"[ARTICLE] {doc.page_content}" for doc in results
    ])

def similarity_search_characters(query: str, k: int = 5) -> str:
    results = characters_vectorstore.similarity_search(query, k=k)

    if not results:
        return "No relevant character data found."
    
    return "\n\n".join([
        f"[CHARACTER] {doc.page_content}" for doc in results
    ])