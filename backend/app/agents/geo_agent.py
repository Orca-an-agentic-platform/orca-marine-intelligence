"""
GeoSpatial Agent
Handles: Geocoding, Restricted Zones, MPA, Routes, Bathymetry, Ports
Restricted zone checks are DETERMINISTIC — no LLM override.
"""
from __future__ import annotations
from datetime import datetime
import structlog
from app.core.llm import llm, ChatMessage
from app.agents.orchestrator import ORCAState, SYSTEM_PROMPT

logger = structlog.get_logger()


class GeoAgent:

    async def run(self, state: ORCAState) -> dict:
        intent = state.get("intent", {})
        location_raw = intent.get("location_raw")

        coords = await self._geocode(location_raw)
        restricted = await self._check_restricted_zones(coords)
        mpa = await self._check_mpa(coords)
        bathymetry = await self._get_bathymetry(coords)
        nearest_port = await self._get_nearest_port(coords)

        # ── DETERMINISTIC: restricted zone = hard block, no LLM override ──
        in_restricted = restricted.get("in_restricted_zone", False)
        if in_restricted:
            state["warnings"].append(
                f"⛔ RESTRICTED ZONE: {restricted.get('zone_name', 'Unknown')} — "
                f"access not permitted. Authority: {restricted.get('authority', 'Unknown')}."
            )
            logger.warning("geo.restricted_zone_violation", location=location_raw)

        return {
            "coordinates": coords,
            "restricted_zone_check": restricted,
            "mpa_check": mpa,
            "bathymetry": bathymetry,
            "nearest_port": nearest_port,
            "in_restricted_zone": in_restricted,  # Hard flag for risk agent
            "retrieved_at": datetime.utcnow().isoformat(),
            "sources": ["Bhuvan/INCOIS", "MPA Registry", "Admiralty Charts"],
        }

    async def _geocode(self, place_name: str | None) -> dict:
        """Nominatim / Bhuvan geocoding — returns lat/lon for named location."""
        if not place_name:
            return {"lat": None, "lon": None, "resolved": False}
        # TODO: integrate Nominatim or Bhuvan geocoding API
        return {
            "lat": 16.9902, "lon": 73.3120,
            "name": place_name or "Unknown",
            "resolved": True,
            "source": "Nominatim (representative)",
            "note": "Replace with live geocoding API",
        }

    async def _check_restricted_zones(self, coords: dict) -> dict:
        """PostGIS ST_Contains check against restricted_zones table."""
        # TODO: implement PostGIS spatial query
        return {
            "in_restricted_zone": False,
            "zone_name": None,
            "zone_type": None,
            "authority": None,
            "source": "restricted_zones (PostGIS)",
            "note": "Replace with live PostGIS ST_Contains query",
        }

    async def _check_mpa(self, coords: dict) -> dict:
        """Check Marine Protected Area overlap."""
        return {
            "in_mpa": False,
            "mpa_name": None,
            "source": "MPA Registry / Bhuvan",
            "note": "Replace with live MPA PostGIS query",
        }

    async def _get_bathymetry(self, coords: dict) -> dict:
        return {
            "depth_m": 45, "source": "GEBCO / Admiralty Charts",
            "note": "Representative sample",
        }

    async def _get_nearest_port(self, coords: dict) -> dict:
        return {
            "name": "Ratnagiri Fishing Harbour",
            "distance_km": 8.2,
            "type": "fishing_harbour",
            "source": "ports table (PostGIS)",
            "note": "Replace with live PostGIS nearest-port query",
        }
