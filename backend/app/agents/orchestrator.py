"""
LangGraph Orchestrator — ORCA Multi-Agent State Machine
Intent → Decompose → Route to Specialist Agents → Synthesise → Risk + Advisory
"""
from __future__ import annotations

import json
import structlog
from datetime import datetime
from typing import Any

from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from app.core.llm import llm, ChatMessage
from app.schemas.core import (
    IntentModel, RiskModel, AdvisoryModel, EvidenceItem,
    MapLayer, UserRole, RiskLevel, AlertSeverity
)

logger = structlog.get_logger()


# ── LangGraph State ────────────────────────────────────────────────────────────

class ORCAState(TypedDict):
    query: str
    session_id: str
    user_role: str
    language: str
    intent: dict                      # IntentModel as dict
    sub_tasks: list[str]
    agent_results: dict[str, Any]     # keyed by agent name
    risk_assessment: dict             # RiskModel as dict
    advisory: dict                    # AdvisoryModel as dict
    evidence: list[dict]
    warnings: list[str]
    map_layers: list[dict]
    audit_log: list[dict]
    error: str | None


# ── System Prompt (shared by all agents) ──────────────────────────────────────

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

async def orchestrator_node(state: ORCAState) -> ORCAState:
    """Parse intent and decompose into sub-tasks."""
    logger.info("orchestrator.start", query=state["query"][:80])

    messages = [
        ChatMessage("system", SYSTEM_PROMPT),
        ChatMessage("user", f"""Extract intent from this marine query and return JSON.

Query: {state['query']}
User role: {state['user_role']}
Language: {state['language']}

Return JSON with:
{{
  "query_type": "fishing_safety|pfz|weather|hazard|route|historical|market|vessel_tracking|general",
  "location_raw": "place name or null",
  "time_reference": "tomorrow morning|today|next 3 days|etc or null",
  "agents_needed": ["marine", "weather", "geo", "risk", "knowledge"],
  "sub_tasks": ["check PFZ for location", "check wave forecast", ...]
}}"""),
    ]

    resp = await llm.chat(messages, temperature=0.0)

    try:
        intent_data = json.loads(resp.content.strip().strip("```json").strip("```"))
    except Exception:
        intent_data = {
            "query_type": "general",
            "location_raw": None,
            "time_reference": None,
            "agents_needed": ["marine", "weather", "geo", "risk"],
            "sub_tasks": ["general marine intelligence query"],
        }

    state["intent"] = intent_data
    state["sub_tasks"] = intent_data.get("sub_tasks", [])
    state["audit_log"].append({
        "step": "orchestrator",
        "timestamp": datetime.utcnow().isoformat(),
        "intent": intent_data,
    })

    logger.info("orchestrator.intent", query_type=intent_data.get("query_type"), agents=intent_data.get("agents_needed"))
    return state


# ── Marine Agent Node ──────────────────────────────────────────────────────────

async def marine_agent_node(state: ORCAState) -> ORCAState:
    """Retrieve SST, chlorophyll, PFZ, currents from DB/APIs."""
    from app.agents.marine_agent import MarineAgent
    agent = MarineAgent()
    result = await agent.run(state)
    state["agent_results"]["marine"] = result
    state["audit_log"].append({"step": "marine_agent", "timestamp": datetime.utcnow().isoformat(), "result_keys": list(result.keys())})
    return state


# ── Weather Agent Node ─────────────────────────────────────────────────────────

async def weather_agent_node(state: ORCAState) -> ORCAState:
    """Retrieve forecast, waves, cyclones, lightning, warnings."""
    from app.agents.weather_agent import WeatherAgent
    agent = WeatherAgent()
    result = await agent.run(state)
    state["agent_results"]["weather"] = result
    state["audit_log"].append({"step": "weather_agent", "timestamp": datetime.utcnow().isoformat(), "result_keys": list(result.keys())})
    return state


# ── Geo Agent Node ────────────────────────────────────────────────────────────

async def geo_agent_node(state: ORCAState) -> ORCAState:
    """Geocode, check restricted zones, compute routes, bathymetry."""
    from app.agents.geo_agent import GeoAgent
    agent = GeoAgent()
    result = await agent.run(state)
    state["agent_results"]["geo"] = result
    state["audit_log"].append({"step": "geo_agent", "timestamp": datetime.utcnow().isoformat(), "result_keys": list(result.keys())})
    return state


# ── Knowledge Agent Node ───────────────────────────────────────────────────────

async def knowledge_agent_node(state: ORCAState) -> ORCAState:
    """Retrieve regulations, advisories, safety docs via RAG."""
    from app.agents.knowledge_agent import KnowledgeAgent
    agent = KnowledgeAgent()
    result = await agent.run(state)
    state["agent_results"]["knowledge"] = result
    state["audit_log"].append({"step": "knowledge_agent", "timestamp": datetime.utcnow().isoformat()})
    return state


# ── Risk Agent Node ────────────────────────────────────────────────────────────

async def risk_agent_node(state: ORCAState) -> ORCAState:
    """Combine all evidence → deterministic rules + ML scoring → RiskModel."""
    from app.agents.risk_agent import RiskAgent
    agent = RiskAgent()
    risk = await agent.run(state)
    state["risk_assessment"] = risk
    state["audit_log"].append({"step": "risk_agent", "timestamp": datetime.utcnow().isoformat(), "risk_level": risk.get("risk_level")})
    return state


# ── Advisory Agent Node ────────────────────────────────────────────────────────

async def advisory_agent_node(state: ORCAState) -> ORCAState:
    """Generate role-specific, multilingual advisory with evidence + map layers."""
    from app.agents.advisory_agent import AdvisoryAgent
    agent = AdvisoryAgent()
    advisory = await agent.run(state)
    state["advisory"] = advisory
    state["audit_log"].append({"step": "advisory_agent", "timestamp": datetime.utcnow().isoformat()})
    return state


# ── Routing logic ──────────────────────────────────────────────────────────────

def route_after_orchestrator(state: ORCAState) -> list[str]:
    """Determine which agent nodes to run in parallel."""
    agents = state["intent"].get("agents_needed", ["marine", "weather", "geo", "risk"])
    node_map = {
        "marine": "marine_agent",
        "weather": "weather_agent",
        "geo": "geo_agent",
        "knowledge": "knowledge_agent",
    }
    return [node_map[a] for a in agents if a in node_map]


# ── Build LangGraph ────────────────────────────────────────────────────────────

def build_orca_graph() -> StateGraph:
    graph = StateGraph(ORCAState)

    # Add nodes
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("marine_agent", marine_agent_node)
    graph.add_node("weather_agent", weather_agent_node)
    graph.add_node("geo_agent", geo_agent_node)
    graph.add_node("knowledge_agent", knowledge_agent_node)
    graph.add_node("risk_agent", risk_agent_node)
    graph.add_node("advisory_agent", advisory_agent_node)

    # Entry point
    graph.set_entry_point("orchestrator")

    # After orchestrator → parallel specialist agents
    graph.add_conditional_edges(
        "orchestrator",
        route_after_orchestrator,
        {
            "marine_agent": "marine_agent",
            "weather_agent": "weather_agent",
            "geo_agent": "geo_agent",
            "knowledge_agent": "knowledge_agent",
        },
    )

    # All specialist agents → risk agent
    for node in ["marine_agent", "weather_agent", "geo_agent", "knowledge_agent"]:
        graph.add_edge(node, "risk_agent")

    # Risk → Advisory → END
    graph.add_edge("risk_agent", "advisory_agent")
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
    """Run the full ORCA multi-agent pipeline for a query."""
    initial_state: ORCAState = {
        "query": query,
        "session_id": session_id,
        "user_role": user_role,
        "language": language,
        "intent": {},
        "sub_tasks": [],
        "agent_results": {},
        "risk_assessment": {},
        "advisory": {},
        "evidence": [],
        "warnings": [],
        "map_layers": [],
        "audit_log": [],
        "error": None,
    }
    result = await orca_graph.ainvoke(initial_state)
    return result
