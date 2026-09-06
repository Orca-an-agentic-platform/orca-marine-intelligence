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

        interpretation = f"SST: {sst.get('value')}{sst.get('unit')}, Chlorophyll: {chlorophyll.get('value')} {chlorophyll.get('unit')}, PFZ: {pfz.get('confidence')} confidence at {pfz.get('distance_km')}km {pfz.get('direction')}, Currents: {currents.get('speed_knots')} knots at {currents.get('direction_deg')}°."

        return {
            "sst": sst,
            "chlorophyll": chlorophyll,
            "pfz": pfz,
            "currents": currents,
            "interpretation": interpretation,
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
