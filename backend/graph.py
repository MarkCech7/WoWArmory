from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, AIMessage, ToolCall
from typing import TypedDict, Annotated
from tools import tools
import os, re, json, uuid, operator

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    session_id: str

llm = ChatOllama(
    model=os.getenv("MODEL"), 
    base_url=os.getenv("MODEL_BASE_URL")
)

llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are a helpful AI assistant for a World of Warcraft private server.

You have access to tools. You MUST call them yourself - do not ask the user to use them.

When you need information:
- IMMEDIATELY call the appropriate tool
- Do NOT say "please use the tool" or "you should call the tool"
- Do NOT ask for clarification, just call the tool

TOOLS:
1. query_auth_db - Query AUTH database (accounts, realmlists)
2. query_characters_db - Query CHARACTERS database (players, guilds)
3. query_world_db - Query WORLD database (creatures, items, quests)
4. search_knowledge_base - Search news, articles, announcements

RULES:
- For news/articles → call search_knowledge_base immediately
- For player/guild data → call SQL tools immediately
- NEVER hallucinate, only use what tools return
- NEVER ask user to call tools, YOU call them

EXAMPLES:
Q: Give me list of players which names starts with "Test" A: query_characters_db("SELECT name FROM `characters`.`characters` WHERE name LIKE 'Test%' LIMIT 10;")
Q: Who is highest rated player in 2v2 right now? A: "SELECT c.name FROM `characters`.`characters` AS c JOIN `characters`.`character_arena_stats` AS a ON c.guid = a.guid WHERE a.slot = 0 AND a.rank = 1;"
"""

def agent_node(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    
    for i, m in enumerate(messages):
        print(f"  --> msg[{i}] {type(m).__name__}: {str(m.content)[:100]}")
    
    response = llm_with_tools.invoke(messages)
    print(f"  --> Response: '{response.content}'")
    
    return {"messages": [response]}

tool_node = ToolNode(tools)

def should_continue(state: AgentState):
    last = state["messages"][-1]

    if hasattr(last, "tool_calls") and last.tool_calls:
        print(f"  --> Tools called: {[tc['name'] for tc in last.tool_calls]}")
        return "tools"

    return END

def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")

    return graph.compile()

app_graph = build_graph()