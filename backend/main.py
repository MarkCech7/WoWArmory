from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from graph import app_graph
from rag import index_web_articles
from contextlib import asynccontextmanager
import uuid

@asynccontextmanager
async def lifespan(app: FastAPI):
    index_web_articles()
    yield

app = FastAPI(title="LangGraph Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, list] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tools_used: list[str]

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):

    session_id = request.session_id or str(uuid.uuid4())
    history = sessions.get(session_id, [])

    history.append(HumanMessage(content=request.message))

    try:
        result = app_graph.invoke({
            "messages": history,
            "session_id": session_id
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    updated_messages = result["messages"]
    sessions[session_id] = updated_messages

    last_reply = ""
    tools_used = []
    for msg in reversed(updated_messages):
        if isinstance(msg, AIMessage) and msg.content:
            last_reply = msg.content
            break

    if not last_reply:
        for msg in reversed(updated_messages):
            if isinstance(msg, ToolMessage):
                last_reply = msg.content
                break

    return ChatResponse(
        reply=last_reply,
        session_id=session_id,
        tools_used=tools_used
    )

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    sessions.pop(session_id, None)
    return {"status": "cleared"}

@app.get("/health")
async def health():
    return {"status": "ok"}