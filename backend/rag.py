from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document
from langchain_chroma import Chroma
from db import query_db
import os

load_dotenv()

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


def similarity_search(query: str, k: int = 5) -> str:
    results = vectorstore.similarity_search(query, k=k)

    if not results:
        return "No relevant data found in knowledge base."

    return "\n\n".join([
        f"[{doc.metadata.get('type', 'unknown').upper()}] {doc.page_content}"
        for doc in results
    ])