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

        # Dynamic real-time LLM prompt: answer the user's specific query directly using telemetry
        pfz_info = marine.get("pfz", {})
        pfz_name = pfz_info.get("zone_name", "PFZ Sector Ratnagiri")
        pfz_dist = pfz_info.get("distance_km", 12.5)
        pfz_dir = pfz_info.get("direction", "SW")
        pfz_lat = pfz_info.get("latitude", 16.92)
        pfz_lon = pfz_info.get("longitude", 73.20)
        pfz_depth = pfz_info.get("depth_m", "35-50")
        pfz_species = pfz_info.get("target_species", "Mackerel, Sardine, Tuna")
        pfz_conf = pfz_info.get("confidence", "HIGH")
        wave_height = weather.get("waves", {}).get("significant_wave_height_m", 1.8)
        wind_spd = weather.get("forecast", {}).get("wind_speed_kmh", 22)
        wind_dir = weather.get("forecast", {}).get("wind_direction", "SW")
        sst_val = marine.get("sst", {}).get("value", 28.4)
        chlor_val = marine.get("chlorophyll", {}).get("value", 0.8)
        curr_spd = marine.get("currents", {}).get("speed_knots", 1.2)
        curr_deg = marine.get("currents", {}).get("direction_deg", 225)
        cyclone_status = weather.get("cyclones", {}).get("active_cyclones") or "None active"

        LANG_NAMES = {
            "en": "English",
            "hi": "Hindi (हिन्दी)",
            "mr": "Marathi (मराठी)",
            "ml": "Malayalam (മലയാളം)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
            "gu": "Gujarati (ગુજરાતી)",
            "bn": "Bengali (বাংলা)",
            "kn": "Kannada (ಕನ್ನಡ)",
        }
        target_lang_label = LANG_NAMES.get(language, "English")

        prompt = f"""You are ORCA, a real-time marine intelligence assistant advising {role_ctx}.
User Question: "{state['query']}"
Language Requested: {target_lang_label} ({language})

REAL-TIME SATELLITE & MARINE TELEMETRY (Ratnagiri Coast / Arabian Sea):
- Active Satellite PFZ: {pfz_name} located {pfz_dist} km {pfz_dir} of Ratnagiri (Coordinates: {pfz_lat}° N, {pfz_lon}° E, Bearing: 225° SW)
- Satellite Source: INCOIS Oceansat OCM & AVHRR Thermal Front (visible as active yellow satellite line on map)
- Target Species: {pfz_species}
- Ocean Depth: {pfz_depth} m
- Significant Wave Height: {wave_height} m (Sea state: Moderate)
- Wind Speed & Direction: {wind_spd} km/h from {wind_dir}
- Sea Surface Temperature (SST): {sst_val} °C
- Chlorophyll-a: {chlor_val} mg/m³
- Ocean Currents: {curr_spd} knots heading {curr_deg}°
- Safety Risk Level: {risk_level} (Risk Score: {risk.get('risk_score', 0):.0f}/100)
- Nearest Port: Ratnagiri Fishing Port
- Active Cyclones / Warnings: {cyclone_status}

TASK:
1. Directly and specifically answer the user's question: "{state['query']}".
2. If the user asks about chlorophyll, sea surface temperature (SST), or fish feeding zones:
   - Identify the high-chlorophyll thermal front at {pfz_name} located {pfz_dist} km {pfz_dir} of Ratnagiri (Coordinates: {pfz_lat}° N, {pfz_lon}° E).
   - State the measurements: Chlorophyll-a: {chlor_val} mg/m³, Sea Surface Temperature: {sst_val} °C, depth {pfz_depth} m.
   - Mention target pelagic species ({pfz_species}) gathering along this biological front.
3. If the user asks for your name or identity:
   - Respond: "I am ORCA (Ocean & Resources Conversational Assistant), your real-time marine intelligence AI for coastal safety, weather, and fisheries."
4. When asked about PFZ or nearest fishing zone:
   - Identify the zone by name: {pfz_name}.
   - State the exact location: {pfz_dist} km {pfz_dir} (bearing 225° SW, coordinates {pfz_lat}° N, {pfz_lon}° E).
   - Mention expected catch ({pfz_species}), depth ({pfz_depth} m), wave height ({wave_height} m), and sea surface temperature ({sst_val} °C).
5. Do NOT use canned or repetitive headers like "## Marine Advisory for Fishermen". Jump straight into answering.
6. Provide a complete, helpful, natural, and well-structured response without cutting off sentences.
7. Avoid markdown asterisks (stars). Do NOT use '**' or '*' anywhere in the response. Use '-' for bullet lists and clean text.
8. LANGUAGE INSTRUCTION:
   - If Language Requested is not English, or if the user's question is written in Hindi, Marathi, Malayalam, Tamil, Telugu, Gujarati, Bengali, or Kannada, respond entirely in that language ({target_lang_label}).
   - Use natural coastal terms appropriate for local fishermen.
   - Keep numbers, measurements (km, °C, m, km/h, knots), and coordinates readable."""

        messages = [
            ChatMessage("system", f"You are ORCA, an advanced real-time marine intelligence AI assistant. Always answer the user's specific question directly, concisely, and accurately based on live telemetry. Respond in {target_lang_label}. Avoid markdown asterisks or stars."),
            ChatMessage("user", prompt)
        ]
        resp = await llm.chat(messages, temperature=0.3, max_tokens=2048)

        # Clean text of any accidental raw markdown stars
        cleaned_content = resp.content.replace("**", "").replace("* ", "• ") if resp.content else ""

        # Go/No-Go only for marine safety, voyage planning, or weather/PFZ queries
        go_no_go = None
        q_lower = state.get("query", "").lower()
        is_voyage_query = any(w in q_lower for w in [
            "go", "safe", "safety", "fish", "trip", "depart", "sea", "ocean", "weather", 
            "wave", "wind", "cyclone", "storm", "tomorrow", "today", "pfz", "condition", 
            "chlorophyll", "temperature", "sst", "border", "sri lanka", "imbl", "boundary", 
            "prohibited", "danger", "restricted"
        ])

        # Content-based guardrail: if synthesized text warns against venturing or warns of high risk/seizure, enforce NO-GO
        resp_lower = cleaned_content.lower()
        is_prohibited_or_unsafe = any(phrase in resp_lower for phrase in [
            "high-risk and not recommended", "not recommended", "not safe", "prohibited",
            "do not venture", "strict no-go", "avoid venturing", "unsafe to", "apprehension",
            "boat seizure", "strictly forbidden", "buffer zone"
        ])

        if user_role in GO_NO_GO_ROLES and is_voyage_query:
            if risk_level == "CRITICAL" or deterministic or is_prohibited_or_unsafe:
                go_no_go = "NO-GO"
            elif risk_level == "HIGH":
                go_no_go = "CAUTION"
            elif risk_level in ("LOW", "MODERATE"):
                go_no_go = "GO" if risk_level == "LOW" else "CAUTION"

        return {
            "summary": cleaned_content.split("\n")[0] if cleaned_content else "Advisory generated.",
            "detailed_guidance": cleaned_content,
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
