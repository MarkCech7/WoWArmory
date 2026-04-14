from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, ToolMessage
from typing import TypedDict, Annotated
from tools import tools
import os, operator

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    session_id: str
    direct: bool

def after_tools(state: AgentState):
    return END if state.get("direct") else "agent"

llm = ChatOllama(
    model=os.getenv("MODEL"), 
    base_url=os.getenv("MODEL_BASE_URL")
)

llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are a helpful AI assistant for a World of Warcraft private server.

You have access to 12 tools. You MUST call them — never answer from memory.

TOOLS AND WHEN TO USE THEM:
1. search_articles_knowledge_base — news, patch notes, PvP changes, gear updates, events, server announcements
2. search_characters_knowledge_base — specific character/player's gear, stats, item level, title, spec (only when on armory page)
3. get_character_armory_url — get a link to a character's armory page by name (use this when there is no character context thus context is undefined)
4. get_arena_leaderboards_url — get arena leaderboard links when asked about PvP rankings or ratings
5. list_characters_by_class — list players of a specific class (Paladin, Mage, Warrior etc.)
6. list_characters_by_race — list players of a specific race (Human, Orc, Night Elf etc.)
7. list_characters_by_level — list players at, above, or below a specific level
8. get_faction_characters — get count of Horde and/or Alliance characters
9. get_list_of_guilds — list guilds on the server or get guild count
10. get_characters_with_highest_hk — find players with the most honorable kills
11. calculate_arena_points — calculate weekly arena points for a given rating
12. get_spell_description — get description and details for a specific spell

ROUTING RULES (follow exactly):
- Question about news, patch notes, server updates, events, announcements → search_articles_knowledge_base
- Question asking to view, show, or see a player's gear, items, or armory → get_character_armory_url
- Question about gear/stats of the CURRENT character (context says user is on armory page) → search_characters_knowledge_base
- Question asking to view characters statistics on main page → get_character_armory_url
- Question about arena ratings, rankings, leaderboards → get_arena_leaderboards_url
- Question asking for players of a specific class such as Paladin, Warrior, Death Knight, Druid, Priest, Shaman, Rogue, Warlock, Mage or Hunter→ list_characters_by_class
- Question asking for players of a specific race such as Orc, Human, Undead, Night Elf, Blood Elf, Tauren, Draenei, Gnome, Dwarf or Troll → list_characters_by_race
- Question asking for players at a specific level → list_characters_by_level
- Question about faction population (horde/alliance counts) → get_faction_characters
- Question about guilds or guild count → get_list_of_guilds
- Question about who has the most kills → get_characters_with_highest_hk
- Question about arena points for a rating → calculate_arena_points
- Question about a specific spell "such as what does Corruption do?" or "describe the Fireball ability" or "what is the effect of Healing Touch?" or "What does spell named Exorcism do?", do not use 'ability' or 'spell' as part of query! → get_spell_description

STRICT RULES:
- When user asks to "show", "view", "see", or "display" gear, items, or armory of a specific player BY NAME → call get_character_armory_url, do NOT call search_characters_knowledge_base
- Never answer without calling a tool first
- Never hallucinate — only use what the tool returns
- Never output raw JSON as your response
- Never use search_characters_knowledge_base for news or announcements
- Never use search_articles_knowledge_base for character data
- Never give recomendations after retrieving data from vectorstore
- Never mention tool names in responses

CONTEXT RULE:
If a system message states the user is viewing a character's armory page, that character is the subject of all questions. Pass their name to search_characters_knowledge_base immediately.
"""

def agent_node(state: AgentState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    
    for m in state["messages"]:
        if m.__class__.__name__ == "HumanMessage":
            print(f"  --> User: {m.content}")
        elif m.__class__.__name__ == "ToolMessage":
            print(f"  --> Tool ({m.name}): {m.content}")
        elif m.__class__.__name__ == "AIMessage" and m.content:
            print(f"  --> AI: {m.content}")
    
    response = llm_with_tools.invoke(messages)
    
    if response.tool_calls:
        for call in response.tool_calls:
            print(f"  --> Calling tool: {call['name']} with args: {call['args']}")
    
    print(f"  --> Response: '{response.content}'")
    
    return {"messages": [response]}

def safe_tool_node(state: AgentState):
    last = state["messages"][-1]
    results = []
    has_direct = False
    tool_map = {t.name: t for t in tools}
    
    for call in last.tool_calls:
        args = dict(call["args"])
        
        if "query" in args and isinstance(args["query"], dict):
            last_user_msg = next(
                (m.content for m in reversed(state["messages"])
                 if m.__class__.__name__ == "HumanMessage"),
                ""
            )
            args["query"] = last_user_msg

        tool = tool_map.get(call["name"])
        if not tool:
            results.append(ToolMessage(content=f"Unknown tool: {call['name']}", tool_call_id=call["id"]))
            continue

        if getattr(tool, "return_direct", False):
            has_direct = True
            
        try:
            result = tool.invoke(args)
        except Exception as e:
            result = f"Tool error: {str(e)}"
        
        results.append(ToolMessage(content=str(result), tool_call_id=call["id"], name=call["name"]))
    
    return {"messages": results, "direct": has_direct}

def should_continue(state: AgentState):
    last = state["messages"][-1]
    
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    
    return END

def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", safe_tool_node)
    graph.set_entry_point("agent")
    
    # agent decides whether to call tools or end
    graph.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END,
        }
    )
    
    # after tools, check if return_direct - if so go to END, otherwise back to agent
    graph.add_conditional_edges(
        "tools",
        lambda state: END if state.get("direct") else "agent",
        {
            "agent": "agent",
            END: END,
        }
    )

    return graph.compile()

app_graph = build_graph()