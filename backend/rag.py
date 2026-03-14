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

vectorstore = Chroma(
    collection_name="server_docs", 
    embedding_function=embeddings,
    persist_directory=os.getenv("CHROMA_PATH")
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
            vectorstore.add_documents(documents)
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
    title = "Character does not have selected title"

    avg_ilvl = round(sum(i["ItemLevel"] for i in items) / len(items))

    if selected_title:
        title = selected_title.replace("%s", "")
    
    text = f"""Character info: {info['name']}
    Class: {info['class']}, Race: {info['race']}, Level: {info['level']}
    Guild: {info['guild_name']}
    Title: {title}
    Specialization: {info['spec_name']}
    Average Item Level: {avg_ilvl}
    Health: {stats['health']}, Strength: {stats['strength']}, Stamina: {stats['stamina']}, Agility: {stats['agility']}, Intellect: {stats['intellect']}, Armor: {stats['armor']}
    
    equipped Items:
    """ + "\n".join(
        f"  Slot {i['slot_name']}: {i['item_name']} (ilvl {i['ItemLevel']})"
        for i in items
    )

    doc = Document(
        page_content=text,
        metadata={"type": "character", "name": info["name"]}
    )

    existing = vectorstore.get(where={"name": info["name"]})

    if existing and existing["ids"]:
        vectorstore.delete(ids=existing["ids"])

    vectorstore.add_documents([doc])
    print(f"Indexed character: {info['name']}")


def similarity_search(query: str, k: int = 5) -> str:
    results = vectorstore.similarity_search(query, k=k)

    if not results:
        return "No relevant data found in knowledge base."

    return "\n\n".join([
        f"[{doc.metadata.get('type', 'unknown').upper()}] {doc.page_content}"
        for doc in results
    ]) 