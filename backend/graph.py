from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, ToolMessage, AIMessage
from typing import TypedDict, Annotated
from tools import tools
import os, operator
from utils import CLASS_NAMES, RACE_NAMES, CURRENT_MAX_LEVEL

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
If a system message starts with [Conversation Summary], treat it as prior conversation context.

You have access to 12 tools. You MUST call them — never answer from memory.

TOOLS AND WHEN TO USE THEM:
1. search_articles_knowledge_base — news, patch notes, PvP changes, gear updates, events, server announcements
2. search_characters_knowledge_base — specific character/player's gear, stats, item level, title, spec
3. get_character_armory_url — get a link to a character's armory page by name
4. get_arena_leaderboards_url — get arena leaderboard links when asked about PvP rankings or ratings
5. list_characters_by_class — list players of a specific class (Paladin, Mage, Warrior etc.)
6. list_characters_by_race — list players of a specific race (Human, Orc, Night Elf etc.)
7. list_characters_by_level — list players at, above, or below a specific level
8. get_faction_characters — get count of Horde and/or Alliance characters
9. get_list_of_guilds — list guilds on the server or get guild count
10. get_characters_with_highest_hk — find players with the most honorable kills
11. calculate_arena_points — calculate weekly arena points for a given rating
12. get_spell_description — get description and details for a specific spell

ARMORY CONTEXT RULE — READ THIS FIRST BEFORE EVERY RESPONSE:
Check if any system message contains "User is currently viewing armory page of character: 'X'".
If YES — X is the current character. Apply these rules strictly:
- ANY question about gear, stats, items, spec, talents, title, item level, guild → search_characters_knowledge_base with name X
- Phrases like "this character", "him", "her", "his gear", "her stats", "describe gear", "what does he wear" all refer to X
- NEVER call get_character_armory_url when armory context is present — user is already on the armory page
If NO armory context — apply normal routing rules below.

ROUTING RULES (follow exactly):
- Question about news, patch notes, server updates, events, announcements → search_articles_knowledge_base
- Question asking to view, show, or find armory of a player BY EXPLICIT NAME and NO armory context → get_character_armory_url
- Question about gear, stats, items, spec, talents, title, item level, guild of a character mentioned BY NAME and NO armory context → get_character_armory_url
- Question about arena ratings, rankings, leaderboards → get_arena_leaderboards_url
- Question asking for players of a specific class such as Paladin, Warrior, Death Knight, Druid, Priest, Shaman, Rogue, Warlock, Mage or Hunter → list_characters_by_class
- Question asking for players of a specific race such as Orc, Human, Undead, Night Elf, Blood Elf, Tauren, Draenei, Gnome, Dwarf or Troll → list_characters_by_race
- Question asking for players at a specific level → list_characters_by_level
- Question about faction population (horde/alliance counts) → get_faction_characters
- Question about guilds or guild count → get_list_of_guilds
- Question about who has the most kills → get_characters_with_highest_hk
- Question about arena points for a rating → calculate_arena_points
- Question about a specific spell such as "what does Corruption do?" or "describe Fireball" or "what is Healing Touch?" — do not include words 'ability' or 'spell' in query → get_spell_description

STRICT RULES:
- Never answer without calling a tool first
- Never hallucinate — only use what the tool returns
- Never output raw JSON as your response
- Never use search_characters_knowledge_base for news or announcements
- Never use search_articles_knowledge_base for character data
- Never give recommendations after retrieving data from vectorstore
- Never mention tool names in responses
- NEVER call search_characters_knowledge_base based on a character name mentioned in user message — only call it when armory context is present
"""

TOOL_VALIDATORS: dict[str, callable] = {}

def validator(tool_name: str):
    def decorator(fn):
        TOOL_VALIDATORS[tool_name] = fn

        return fn
    
    return decorator

@validator("list_characters_by_level")
def validate_level(args: dict) -> str | None:
    query = str(args.get("query", ""))

    if not any(c.isdigit() for c in query):
        return f"Level query must contain a number, got: '{query}'"

    digits = ''.join(filter(str.isdigit, query))
    level = int(digits)

    if level < 1:
        return f"Level must be at least 1, got: {level}"
    
    if level > CURRENT_MAX_LEVEL:
        return f"Level {level} exceeds current maximum level {CURRENT_MAX_LEVEL}"
    
    return None

@validator("calculate_arena_points")
def validate_arena_points(args: dict) -> str | None:
    try:
        rating = int(args.get("rating", 0))

        if rating < 0:
            return f"Rating cannot be negative, got: {rating}"
        
        if rating > 3600:
            return f"Rating {rating} is unrealistically high — maximum is around 3600"
        
    except (ValueError, TypeError):
        return f"Rating must be an integer, got: '{args.get('rating')}'"
    
    return None

@validator("list_characters_by_class")
def validate_class(args: dict) -> str | None:
    class_name = args.get("class_name", "").strip().lower()
    valid = [n.lower() for n in CLASS_NAMES.values()]

    if class_name not in valid:
        return f"Unknown class '{args.get('class_name')}'. Valid: {', '.join(CLASS_NAMES.values())}"
    
    return None

@validator("list_characters_by_race")
def validate_race(args: dict) -> str | None:
    race_name = args.get("race_name", "").strip().lower()
    aliases = {"nelf", "nightelf", "belf", "bloodelf"}
    valid = [n.lower() for n in RACE_NAMES.values()]

    if race_name not in valid and race_name not in aliases:
        return f"Unknown race '{args.get('race_name')}'. Valid: {', '.join(RACE_NAMES.values())}"
    
    return None

@validator("get_character_armory_url")
def validate_character_name(args: dict) -> str | None:
    name = args.get("name", "").strip()

    if not name:
        return "Character name cannot be empty"
    
    if len(name) < 2 or len(name) > 24:
        return f"Character name '{name}' has invalid length (must be 2-24 characters)"
    
    return None

def validate_node(state: AgentState):
    last = state["messages"][-1]
    
    if not hasattr(last, "tool_calls") or not last.tool_calls:
        return {"messages": []}
    
    errors = []
    valid_calls = []
    
    for call in last.tool_calls:
        validator_fn = TOOL_VALIDATORS.get(call["name"])

        if validator_fn:
            error = validator_fn(call["args"])

            if error:
                print(f"  --> Validation failed for {call['name']}: {error}")
                errors.append(error)
                continue
        valid_calls.append(call)
    
    if errors:
        last.tool_calls = valid_calls
        error_msg = " | ".join(errors)
        return {
            "messages": [AIMessage(content=f"I couldn't process that request: {error_msg}")]
        }
    
    return {"messages": []}

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
    graph.add_node("validate", validate_node)
    graph.add_node("tools", safe_tool_node)
    graph.set_entry_point("agent")
    
    graph.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "validate",
            END: END,
        }
    )

    graph.add_conditional_edges(
        "validate",
        lambda state: (
            END if state["messages"] and
            state["messages"][-1].__class__.__name__ == "AIMessage" and
            not getattr(state["messages"][-1], "tool_calls", None)
            else "tools"
        ),
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