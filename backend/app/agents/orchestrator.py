"""
LangGraph Orchestrator — ORCA Multi-Agent State Machine
Intent → Decompose → Route to Specialist Agents → Synthesise → Risk + Advisory

KEY LANGGRAPH RULE (parallel branches):
  - Each node function must return ONLY the dict keys it modifies.
  - Returning the full state causes INVALID_CONCURRENT_GRAPH_UPDATE on Annotated fields.
  - Annotated[..., reducer] fields are merged automatically by LangGraph.
"""
from __future__ import annotations

import json
import operator
import structlog
from datetime import datetime
from typing import Annotated, Any

from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from app.core.llm import llm, ChatMessage

logger = structlog.get_logger()


# ── Reducer helpers ────────────────────────────────────────────────────────────

def merge_dicts(a: dict, b: dict) -> dict:
    """Shallow-merge two dicts. Parallel agents each write their own sub-key."""
    return {**a, **b}


# ── LangGraph State ────────────────────────────────────────────────────────────
# • Scalar fields (str, dict written sequentially) — plain TypedDict fields.
# • Fields written by PARALLEL nodes — MUST use Annotated[T, reducer].

class ORCAState(TypedDict):
    # Set once at startup — never touched by parallel nodes
    query: str
    session_id: str
    user_role: str
    language: str

    # Written by orchestrator (sequential)
    intent: dict
    sub_tasks: list[str]

    # Written by risk_agent (sequential, after all parallel agents finish)
    risk_assessment: dict

    # Written by advisory_agent (sequential, last)
    advisory: dict

    # Error flag
    error: str | None

    # ── Written by PARALLEL specialist agents — reducers required ──────────────
    # Each parallel agent returns {"agent_results": {"<agent_name>": result}}
    # merge_dicts merges all per-agent dicts into one shared dict.
    agent_results: Annotated[dict[str, Any], merge_dicts]

    # operator.add concatenates lists from parallel nodes
    evidence:   Annotated[list[dict], operator.add]
    warnings:   Annotated[list[str],  operator.add]
    map_layers: Annotated[list[dict], operator.add]
    audit_log:  Annotated[list[dict], operator.add]


# ── System Prompt ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are ORCA, a marine intelligence assistant.
CRITICAL RULES:
1. You are NOT the source of marine truth. Only explain and plan.
2. Never say "guaranteed safe", "guaranteed catch", or "perfect prediction".
3. Always use risk-aware language: "conditions appear suitable", "based on available data".
4. Official warnings and advisories are AUTHORITATIVE — always surface them.
5. Every factual claim must cite a data source and timestamp.
6. If data is stale or missing, disclose it explicitly.
7. Restricted zone violations are HARD BLOCKS — not subject to LLM override.
"""


# ── Orchestrator Node ──────────────────────────────────────────────────────────

async def orchestrator_node(state: ORCAState) -> dict:
    """Parse intent and decompose into sub-tasks.
    Returns only the keys this node writes: intent, sub_tasks, audit_log.
    """
    logger.info("orchestrator.start", query=state["query"][:80])

    q_lower = state["query"].lower()
    if any(k in q_lower for k in ["pfz", "fish", "wave", "wind", "weather", "hazard", "route", "safe", "nearest", "sea"]):
        intent_data = {
            "query_type": "pfz" if "pfz" in q_lower else ("weather" if "wave" in q_lower or "weather" in q_lower else "fishing_safety"),
            "location_raw": "Ratnagiri Coast" if "ratnagiri" in q_lower else None,
            "time_reference": "today",
            "agents_needed": ["marine", "weather", "geo", "knowledge"],
            "sub_tasks": ["retrieve PFZ and sea surface data", "retrieve wave and weather forecast"],
        }
    else:
        try:
            messages = [
                ChatMessage("system", SYSTEM_PROMPT),
                ChatMessage("user", f"""Extract intent from this marine query and return JSON only.

Query: {state['query']}
User role: {state['user_role']}
Language: {state['language']}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "query_type": "fishing_safety|pfz|weather|hazard|route|historical|market|vessel_tracking|general",
  "location_raw": "place name or null",
  "time_reference": "tomorrow morning|today|next 3 days|etc or null",
  "agents_needed": ["marine", "weather", "geo", "knowledge"],
  "sub_tasks": ["check PFZ for location", "check wave forecast"]
}}"""),
            ]
            resp = await llm.chat(messages, temperature=0.0)
            raw = resp.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            intent_data = json.loads(raw.strip())
        except Exception:
            intent_data = {
                "query_type": "general",
                "location_raw": None,
                "time_reference": None,
                "agents_needed": ["marine", "weather", "geo"],
                "sub_tasks": ["general marine intelligence query"],
            }

    logger.info("orchestrator.intent",
                query_type=intent_data.get("query_type"),
                agents=intent_data.get("agents_needed"))

    # Return ONLY the keys we modified
    return {
        "intent": intent_data,
        "sub_tasks": intent_data.get("sub_tasks", []),
        "audit_log": [{
            "step": "orchestrator",
            "timestamp": datetime.utcnow().isoformat(),
            "intent": intent_data,
        }],
    }


# ── Marine Agent Node ──────────────────────────────────────────────────────────

async def marine_agent_node(state: ORCAState) -> dict:
    """Retrieve SST, chlorophyll, PFZ, currents. Returns only agent_results + audit_log."""
    from app.agents.marine_agent import MarineAgent
    agent = MarineAgent()
    result = await agent.run(state)
    return {
        "agent_results": {"marine": result},
        "audit_log": [{"step": "marine_agent", "timestamp": datetime.utcnow().isoformat()}],
    }


# ── Weather Agent Node ─────────────────────────────────────────────────────────

async def weather_agent_node(state: ORCAState) -> dict:
    """Retrieve forecast, waves, cyclones, lightning, warnings."""
    from app.agents.weather_agent import WeatherAgent
    agent = WeatherAgent()
    result = await agent.run(state)
    return {
        "agent_results": {"weather": result},
        "audit_log": [{"step": "weather_agent", "timestamp": datetime.utcnow().isoformat()}],
    }


# ── Geo Agent Node ─────────────────────────────────────────────────────────────

async def geo_agent_node(state: ORCAState) -> dict:
    """Geocode, check restricted zones, compute routes, bathymetry."""
    from app.agents.geo_agent import GeoAgent
    agent = GeoAgent()
    result, extra_warnings = await agent.run_with_warnings(state)
    return {
        "agent_results": {"geo": result},
        "warnings": extra_warnings,  # list — appended via operator.add reducer
        "audit_log": [{"step": "geo_agent", "timestamp": datetime.utcnow().isoformat()}],
    }


# ── Knowledge Agent Node ───────────────────────────────────────────────────────

async def knowledge_agent_node(state: ORCAState) -> dict:
    """Retrieve regulations, advisories, safety docs via RAG."""
    from app.agents.knowledge_agent import KnowledgeAgent
    agent = KnowledgeAgent()
    result = await agent.run(state)
    return {
        "agent_results": {"knowledge": result},
        "audit_log": [{"step": "knowledge_agent", "timestamp": datetime.utcnow().isoformat()}],
    }


# ── Risk Agent Node ────────────────────────────────────────────────────────────

async def risk_agent_node(state: ORCAState) -> dict:
    """Combine all evidence → deterministic rules + scoring → RiskModel."""
    from app.agents.risk_agent import RiskAgent
    agent = RiskAgent()
    risk = await agent.run(state)
    return {
        "risk_assessment": risk,
        "audit_log": [{"step": "risk_agent", "timestamp": datetime.utcnow().isoformat(),
                       "risk_level": risk.get("risk_level")}],
    }


# ── Advisory Agent Node ────────────────────────────────────────────────────────

async def advisory_agent_node(state: ORCAState) -> dict:
    """Generate role-specific, multilingual advisory with evidence + map layers."""
    from app.agents.advisory_agent import AdvisoryAgent
    agent = AdvisoryAgent()
    advisory = await agent.run(state)
    return {
        "advisory": advisory,
        "audit_log": [{"step": "advisory_agent", "timestamp": datetime.utcnow().isoformat()}],
    }


# ── Routing logic ──────────────────────────────────────────────────────────────

def route_after_orchestrator(state: ORCAState) -> list[str]:
    """Which parallel specialist agents to run based on parsed intent."""
    agents = state["intent"].get("agents_needed", ["marine", "weather", "geo"])
    node_map = {
        "marine":    "marine_agent",
        "weather":   "weather_agent",
        "geo":       "geo_agent",
        "knowledge": "knowledge_agent",
    }
    selected = [node_map[a] for a in agents if a in node_map]
    # Always run at least marine + weather
    if not selected:
        selected = ["marine_agent", "weather_agent"]
    return selected


# ── Build LangGraph ────────────────────────────────────────────────────────────

def build_orca_graph() -> StateGraph:
    graph = StateGraph(ORCAState)

    graph.add_node("orchestrator",    orchestrator_node)
    graph.add_node("marine_agent",    marine_agent_node)
    graph.add_node("weather_agent",   weather_agent_node)
    graph.add_node("geo_agent",       geo_agent_node)
    graph.add_node("knowledge_agent", knowledge_agent_node)
    graph.add_node("risk_agent",      risk_agent_node)
    graph.add_node("advisory_agent",  advisory_agent_node)

    graph.set_entry_point("orchestrator")

    graph.add_conditional_edges(
        "orchestrator",
        route_after_orchestrator,
        {
            "marine_agent":    "marine_agent",
            "weather_agent":   "weather_agent",
            "geo_agent":       "geo_agent",
            "knowledge_agent": "knowledge_agent",
        },
    )

    for node in ["marine_agent", "weather_agent", "geo_agent", "knowledge_agent"]:
        graph.add_edge(node, "risk_agent")

    graph.add_edge("risk_agent",    "advisory_agent")
    graph.add_edge("advisory_agent", END)

    return graph.compile()


# Compiled graph singleton
orca_graph = build_orca_graph()


async def run_orca(
    query: str,
    session_id: str,
    user_role: str = "fisherman",
    language: str = "en",
) -> ORCAState:
    """Run the full ORCA multi-agent pipeline."""
    initial_state: ORCAState = {
        "query":           query,
        "session_id":      session_id,
        "user_role":       user_role,
        "language":        language,
        "intent":          {},
        "sub_tasks":       [],
        "agent_results":   {},
        "risk_assessment": {},
        "advisory":        {},
        "evidence":        [],
        "warnings":        [],
        "map_layers":      [],
        "audit_log":       [],
        "error":           None,
    }
    result = await orca_graph.ainvoke(initial_state)
    return result
