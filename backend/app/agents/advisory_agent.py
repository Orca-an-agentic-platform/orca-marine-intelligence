"""
Advisory Agent — Role-aware, multilingual guidance with evidence + map layers
Turns RiskModel + agent results into actionable, grounded advisory.
"""
from __future__ import annotations
from datetime import datetime
import structlog
from app.core.llm import llm, ChatMessage
from app.agents.orchestrator import ORCAState, SYSTEM_PROMPT

logger = structlog.get_logger()

ROLE_CONTEXT = {
    "fisherman": "a fisherman planning to go to sea. Prioritise safety, PFZ location, and practical guidance in simple language.",
    "coastal_authority": "a coastal authority officer monitoring vessel activity and enforcing maritime rules.",
    "disaster_management": "a disaster management operator prioritising response and coordination.",
    "maritime_operator": "a maritime operations manager planning vessel schedules and routes.",
    "researcher": "a marine researcher interested in detailed oceanographic data and analysis.",
    "institutional_researcher": "an institutional marine researcher needing comprehensive data with citations.",
    "shipping_operator": "a shipping operator planning safe and efficient cargo routes.",
    "fisheries_dept": "a fisheries department official monitoring compliance and zone activity.",
}

GO_NO_GO_ROLES = {"fisherman", "maritime_operator", "shipping_operator"}


class AdvisoryAgent:

    async def run(self, state: ORCAState) -> dict:
        risk = state.get("risk_assessment", {})
        marine = state["agent_results"].get("marine", {})
        weather = state["agent_results"].get("weather", {})
        geo = state["agent_results"].get("geo", {})
        knowledge = state["agent_results"].get("knowledge", {})
        user_role = state.get("user_role", "fisherman")
        language = state.get("language", "en")

        role_ctx = ROLE_CONTEXT.get(user_role, ROLE_CONTEXT["fisherman"])
        risk_level = risk.get("risk_level", "UNKNOWN")
        deterministic = risk.get("deterministic_override")

        # Build evidence list
        evidence = []
        for agent_name, agent_data in state["agent_results"].items():
            if isinstance(agent_data, dict) and "sources" in agent_data:
                for src in agent_data["sources"]:
                    evidence.append({
                        "claim": f"Data from {agent_name} agent",
                        "source": src,
                        "retrieved_at": agent_data.get("retrieved_at", datetime.utcnow().isoformat()),
                        "quality_flag": "sample",
                        "is_official_warning": agent_data.get("has_active_official_warning", False),
                    })

        # Map layers spec for frontend
        map_layers = [
            {"layer_id": "sst", "layer_type": "raster", "title": "Sea Surface Temperature", "visible_by_default": True},
            {"layer_id": "pfz", "layer_type": "geojson", "title": "Potential Fishing Zones", "visible_by_default": True},
            {"layer_id": "weather", "layer_type": "vector", "title": "Wind & Wave Conditions", "visible_by_default": True},
            {"layer_id": "restricted", "layer_type": "geojson", "title": "Restricted Zones", "visible_by_default": True},
        ]
        if risk_level in ("HIGH", "CRITICAL"):
            map_layers.append({"layer_id": "hazard", "layer_type": "geojson", "title": "Active Hazard Zones", "visible_by_default": True})

        # LLM generates the advisory text
        prompt = f"""Generate a marine advisory for {role_ctx}

Query: {state['query']}
Risk Level: {risk_level}
Risk Score: {risk.get('risk_score', 0):.0f}/100
Active Official Warnings: {risk.get('active_official_warnings', [])}
Deterministic Override: {deterministic or 'None'}

Marine Conditions:
- SST: {marine.get('sst', {}).get('value')} °C
- PFZ: {marine.get('pfz', {})}
- Currents: {marine.get('currents', {})}

Weather:
- Wind: {weather.get('forecast', {}).get('wind_speed_kmh')} km/h {weather.get('forecast', {}).get('wind_direction')}
- Waves: {weather.get('waves', {}).get('significant_wave_height_m')} m
- Cyclone: {weather.get('cyclones', {}).get('active_cyclones')}

Location:
- Nearest Port: {geo.get('nearest_port', {}).get('name')}
- Restricted Zone: {geo.get('in_restricted_zone')}

Provide:
1. One-sentence summary (plain language)
2. Detailed guidance (3-5 sentences, role-specific)
3. 3-5 specific precautions as bullet points
4. One limitations/uncertainty note
5. Do NOT say "guaranteed safe" or "guaranteed catch"
6. If risk is HIGH or CRITICAL, lead with that warning
7. Cite sources for all factual claims"""

        messages = [ChatMessage("system", SYSTEM_PROMPT), ChatMessage("user", prompt)]
        resp = await llm.chat(messages, temperature=0.15, max_tokens=800)

        # Go/No-Go for fishermen and operators
        go_no_go = None
        if user_role in GO_NO_GO_ROLES:
            if risk_level == "CRITICAL" or deterministic:
                go_no_go = "NO-GO"
            elif risk_level == "HIGH":
                go_no_go = "CAUTION"
            elif risk_level in ("LOW", "MODERATE"):
                go_no_go = "GO" if risk_level == "LOW" else "CAUTION"

        return {
            "summary": resp.content.split("\n")[0] if resp.content else "Advisory generated.",
            "detailed_guidance": resp.content,
            "precautions": [
                "Always carry a working life jacket and VHF radio",
                "Check IMD weather updates before departure",
                "Inform coastal authority of your planned route",
                "Return immediately if conditions deteriorate",
                "Never ignore official warnings",
            ],
            "limitations": [
                risk.get("uncertainty_note", ""),
                "Data may be representative — verify with live feeds before operational use.",
            ],
            "official_warnings": risk.get("active_official_warnings", []),
            "go_no_go": go_no_go,
            "confidence_score": max(0.0, 1.0 - (risk.get("risk_score", 0) / 200)),
            "language": language,
            "evidence": evidence,
            "map_layers": map_layers,
            "generated_at": datetime.utcnow().isoformat(),
        }
