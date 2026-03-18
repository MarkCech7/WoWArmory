from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, ToolMessage
from typing import TypedDict, Annotated
from tools import tools
import os, re, json, uuid, operator

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    session_id: str

llm = ChatOllama(
    model=os.getenv("MODEL"), 
    base_url=os.getenv("MODEL_BASE_URL")
)

llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are a helpful AI assistant for a World of Warcraft private server.

You have access to 5 tools. You MUST call them — never answer from memory.

RULES:
- DO NOT GIVE RECOMENDATIONS AFTER RETRIEVING DATA FROM VECTORSTORE
- DO NOT MENTION PHRASES LIKE "THESE CHANGES MIGHT NOT BE UP TO DATE"
- Would you like me to guide on how to search for a list using query_characters_db?

TOOLS AND WHEN TO USE THEM:
1. search_articles_knowledge_base — news, patch notes, PvP changes, gear updates, events, announcements
2. search_characters_knowledge_base — specific player data: gear, stats, item level, title, guild, spec
3. query_characters_db — SQL queries on players, guilds, arena rankings, character lists
4. query_auth_db — SQL queries on accounts
5. query_world_db — SQL queries on creatures, items, quests

ROUTING RULES (follow exactly):
- Question about news, articles, patch notes, server updates → search_articles_knowledge_base
- Question about a specific named player OR context says user is on a character page → search_characters_knowledge_base
- Question needs a list, count, ranking, or exact lookup of players/guilds → query_characters_db
- Never use search_characters_knowledge_base for news
- Never use search_articles_knowledge_base for character data
- Never answer without calling a tool first
- Never hallucinate — only use what the tool returns
- Never output raw JSON or tool signatures as your response
- Do not answer non-WoW questions — say "I can only answer questions related to World of Warcraft and this server."

EXAMPLES:
Q: Give me list of players which names starts with "Test" A: call query_characters_db with SELECT name FROM characters.characters WHERE name LIKE 'Test%' LIMIT 10
Q: Who is highest rated player in 2v2? A: call query_characters_db with appropriate SQL
Q: Which equipped item has the lowest item level? A: call search_characters_knowledge_base with the character name from context, then find the lowest item level item in the result
Q: What is the main stat of this character? A: call search_characters_knowledge_base with the character name from context

CONTEXT RULE:
If a system message states the user is viewing a character page, that character's name is the subject of all questions until told otherwise. Always pass that name to search_characters_knowledge_base.
"""

def agent_node(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    
    for i, m in enumerate(messages):
        print(f"  --> msg[{i}] {type(m).__name__}: {str(m.content)}")
    
    response = llm_with_tools.invoke(messages)
    print(f"  --> Response: '{response.content}'")
    
    return {"messages": [response]}

from langchain_core.messages import ToolMessage

def safe_tool_node(state: AgentState):
    last = state["messages"][-1]
    results = []
    
    tool_map = {t.name: t for t in tools}
    
    for call in last.tool_calls:
        args = dict(call["args"])
        
        # fix malformed query dict from model by extracting last user message as fallback query
        if "query" in args and isinstance(args["query"], dict):
            last_user_msg = next(
                (m.content for m in reversed(state["messages"])
                 if m.__class__.__name__ == "HumanMessage"),
                ""
            )
            args["query"] = last_user_msg
            print(f"  --> Fixed malformed query to: {last_user_msg}")
        
        tool = tool_map.get(call["name"])
        if not tool:
            results.append(ToolMessage(content=f"Unknown tool: {call['name']}", tool_call_id=call["id"]))
            continue
            
        try:
            result = tool.invoke(args)
        except Exception as e:
            result = f"Tool error: {str(e)}"
        
        results.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    
    return {"messages": results}

def should_continue(state: AgentState):
    last = state["messages"][-1]

    if hasattr(last, "tool_calls") and last.tool_calls:
        print(f"  --> Tools called: {[tc['name'] for tc in last.tool_calls]}")
        return "tools"

    return END

def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", safe_tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")

    return graph.compile()

app_graph = build_graph()