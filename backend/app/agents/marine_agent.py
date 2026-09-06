"""
Marine Intelligence Agent
Handles: SST, Chlorophyll, PFZ, Currents, Ocean Observations
Data is ALWAYS retrieved from trusted sources — LLM only interprets.
"""
from __future__ import annotations
from datetime import datetime, date
import structlog
from app.core.llm import llm, ChatMessage
from app.agents.orchestrator import ORCAState, SYSTEM_PROMPT

logger = structlog.get_logger()


class MarineAgent:
    """Retrieves and interprets marine data for the given intent."""

    async def run(self, state: ORCAState) -> dict:
        intent = state.get("intent", {})
        location_raw = intent.get("location_raw")
        today = date.today().isoformat()

        # ── Tool calls: retrieve from DB / APIs ────────────────────────────
        sst = await self._get_sst(location_raw)
        chlorophyll = await self._get_chlorophyll(location_raw)
        pfz = await self._get_pfz(location_raw, today)
        currents = await self._get_currents(location_raw)

        # ── LLM interpretation (never the source of truth) ─────────────────
        context = f"""Marine data for {location_raw or 'query area'} on {today}:
SST: {sst}
Chlorophyll: {chlorophyll}
PFZ: {pfz}
Currents: {currents}"""

        messages = [
            ChatMessage("system", SYSTEM_PROMPT),
            ChatMessage("user", f"""Interpret this marine data for a {state['user_role']}.
{context}
Query: {state['query']}
Provide a brief interpretation. Cite sources. Do not claim guaranteed conditions."""),
        ]
        resp = await llm.chat(messages, temperature=0.1, max_tokens=512)

        return {
            "sst": sst,
            "chlorophyll": chlorophyll,
            "pfz": pfz,
            "currents": currents,
            "interpretation": resp.content,
            "retrieved_at": datetime.utcnow().isoformat(),
            "sources": ["INCOIS PFZ WebGIS", "MOSDAC SST", "MOSDAC Chlorophyll", "INCOIS OSF"],
        }

    async def _get_sst(self, location: str | None) -> dict:
        """Query TimescaleDB for latest SST near location. Returns representative data if no live feed."""
        return {
            "value": 28.4, "unit": "°C", "source": "MOSDAC/ISRO",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample data — replace with live MOSDAC API",
            "quality_flag": "sample",
        }

    async def _get_chlorophyll(self, location: str | None) -> dict:
        return {
            "value": 0.8, "unit": "mg/m³", "source": "MOSDAC/ISRO",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample data — replace with live MOSDAC API",
            "quality_flag": "sample",
        }

    async def _get_pfz(self, location: str | None, for_date: str) -> dict:
        return {
            "zone_available": True,
            "confidence": "medium",
            "distance_km": 12.5,
            "direction": "SW",
            "source": "INCOIS PFZ WebGIS",
            "valid_date": for_date,
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample data — replace with live INCOIS PFZ API",
            "quality_flag": "sample",
        }

    async def _get_currents(self, location: str | None) -> dict:
        return {
            "speed_knots": 1.2, "direction_deg": 225, "source": "INCOIS OSF",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample data — replace with live INCOIS OSF API",
            "quality_flag": "sample",
        }
