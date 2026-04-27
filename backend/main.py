from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from graph import app_graph, llm
from langchain_core.prompts import ChatPromptTemplate
from rag import index_web_articles
from contextlib import asynccontextmanager
import uuid
from routers import armory, leaderboards, auth
from tools import parser

MAX_HISTORY_MESSAGES = 10
SUMMARIZE_BATCH = 4
KEEP_RECENT_MESSAGES = 6 

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

app.include_router(armory.router)
app.include_router(leaderboards.router)
app.include_router(auth.router)

sessions: dict[str, dict] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    context: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tools_used: list[str]

summarize_prompt = ChatPromptTemplate.from_template(
    "Summarize the following conversation history concisely, preserving key facts like "
    "character names, queries made, and answers given. Output only the summary, nothing else.\n\n"
    "{history}"
)

summarize_chain = summarize_prompt | llm | parser


def maybe_summarize_history(history: list) -> list:
    non_summary = [m for m in history if not isinstance(m, SystemMessage)]
    
    if len(non_summary) < MAX_HISTORY_MESSAGES:
        return history

    # Only trigger when enough new messages have accumulated beyond KEEP_RECENT_MESSAGES
    compressible = len(non_summary) - KEEP_RECENT_MESSAGES
    if compressible < SUMMARIZE_BATCH:
        return history

    existing_summary = ""
    if history and isinstance(history[0], SystemMessage):
        existing_summary = history[0].content
        history = history[1:]

    old_messages = [m for m in history if not isinstance(m, SystemMessage)][:-KEEP_RECENT_MESSAGES]
    recent_messages = [m for m in history if not isinstance(m, SystemMessage)][-KEEP_RECENT_MESSAGES:]

    formatted = []
    if existing_summary:
        formatted.append(f"[Previous Summary]: {existing_summary}")

    for m in old_messages:
        role = m.__class__.__name__.replace("Message", "")
        formatted.append(f"{role}: {m.content}")

    history_text = "\n".join(formatted)
    summary_text = summarize_chain.invoke({"history": history_text})

    return [SystemMessage(content=f"[Conversation Summary]: {summary_text}")] + recent_messages

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    session = sessions.get(session_id, {"history": [], "context": None})

    if request.context:
        session["context"] = request.context

    context = session["context"]
    history = session["history"]

    history = maybe_summarize_history(history)
    session["history"] = history
    message = request.message

    if context:
        message = f"{context} {request.message}"

    history.append(HumanMessage(content=message))
    sessions[session_id] = session

    try:
        result = app_graph.invoke({
            "messages": history,
            "session_id": session_id,
            "direct": False
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    updated_messages = result["messages"]
    last = updated_messages[-1]
    tools_used = [
        call["name"]
        for msg in updated_messages
        if hasattr(msg, "tool_calls")
        for call in msg.tool_calls
    ]

    if last.__class__.__name__ == "ToolMessage":
        last_reply = last.content
        synthetic_ai = AIMessage(content=last_reply)
        session["history"] = history + [synthetic_ai]
    else:
        last_reply = next(
            (m.content for m in reversed(updated_messages)
            if m.__class__.__name__ == "AIMessage" and m.content),
            ""
        )
        session["history"] = [
            m for m in updated_messages
            if m.__class__.__name__ in ("HumanMessage", "AIMessage")
            and m.content
        ]

    session["history"] = maybe_summarize_history(session["history"])
    sessions[session_id] = session

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