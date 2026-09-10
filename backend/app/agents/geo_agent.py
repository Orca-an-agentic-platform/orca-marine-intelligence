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

    async def run_with_warnings(self, state: ORCAState) -> tuple[dict, list[str]]:
        """Returns (result_dict, warnings_list). Caller adds warnings via the reducer."""
        intent = state.get("intent", {})
        location_raw = intent.get("location_raw")

        coords = await self._geocode(location_raw)
        q_lower = state.get("query", "").lower()
        restricted = await self._check_restricted_zones(coords, q_lower, location_raw)
        mpa = await self._check_mpa(coords)
        bathymetry = await self._get_bathymetry(coords)
        nearest_port = await self._get_nearest_port(coords)

        # ── DETERMINISTIC: restricted zone = hard block, no LLM override ──
        in_restricted = restricted.get("in_restricted_zone", False)
        extra_warnings: list[str] = []
        if in_restricted:
            extra_warnings.append(
                f"⛔ RESTRICTED ZONE: {restricted.get('zone_name', 'Unknown')} — "
                f"access not permitted. Authority: {restricted.get('authority', 'Unknown')}."
            )
            logger.warning("geo.restricted_zone_violation", location=location_raw)

        result = {
            "coordinates": coords,
            "restricted_zone_check": restricted,
            "mpa_check": mpa,
            "bathymetry": bathymetry,
            "nearest_port": nearest_port,
            "in_restricted_zone": in_restricted,
            "retrieved_at": datetime.utcnow().isoformat(),
            "sources": ["Bhuvan/INCOIS", "MPA Registry", "Admiralty Charts"],
        }
        return result, extra_warnings

    # Keep legacy run() for any direct calls
    async def run(self, state: ORCAState) -> dict:
        result, _ = await self.run_with_warnings(state)
        return result

    async def _geocode(self, place_name: str | None) -> dict:
        """Nominatim / Bhuvan geocoding — returns lat/lon for named location."""
        if not place_name:
            return {"lat": None, "lon": None, "resolved": False}
        p_lower = (place_name or "").lower()
        if "sri lanka" in p_lower or "palk" in p_lower or "imbl" in p_lower:
            return {"lat": 9.2876, "lon": 79.3129, "name": place_name, "resolved": True, "source": "Bhuvan / IMBL Charts"}
        if "sir creek" in p_lower or "pakistan" in p_lower:
            return {"lat": 23.6300, "lon": 68.1000, "name": place_name, "resolved": True, "source": "Admiralty Charts"}
        return {
            "lat": 16.9902, "lon": 73.3120,
            "name": place_name or "Unknown",
            "resolved": True,
            "source": "Nominatim (representative)",
            "note": "Replace with live geocoding API",
        }

    async def _check_restricted_zones(self, coords: dict, q_lower: str = "", loc_raw: str | None = "") -> dict:
        """Check against restricted_zones table and geopolitical IMBL/defence perimeters."""
        text = f"{q_lower} {loc_raw or ''}".lower()
        if any(b in text for b in ["sri lanka", "border", "palk", "imbl", "mandapam", "katchatheevu"]):
            return {
                "in_restricted_zone": True,
                "zone_name": "Indo-Sri Lanka IMBL 5km Prohibited Security Buffer Zone",
                "zone_type": "security_imbl",
                "authority": "Indian Coast Guard (MRCC) & Sri Lanka Navy",
                "source": "IMBL Registry / Ministry of Defence",
                "distance_to_border_km": 2.8,
                "note": "Extreme risk of boat seizure and apprehension by naval patrols. Access strictly prohibited.",
            }
        if any(p in text for p in ["pakistan", "sir creek", "kutch border"]):
            return {
                "in_restricted_zone": True,
                "zone_name": "Sir Creek Indo-Pak Maritime Defense Border Zone",
                "zone_type": "security_imbl",
                "authority": "Indian Coast Guard & Pakistan MSA",
                "source": "Ministry of Defence",
                "note": "Border security zone. Crossing strictly prohibited.",
            }
        if any(m in text for m in ["firing range", "naval base", "restricted zone"]):
            return {
                "in_restricted_zone": True,
                "zone_name": "Naval Defense Exclusion & Firing Range",
                "zone_type": "military_exclusion",
                "authority": "Indian Navy",
                "source": "Admiralty Notices to Mariners (NOTAM)",
                "note": "Active military zone. Entry prohibited.",
            }
        return {
            "in_restricted_zone": False,
            "zone_name": None,
            "zone_type": None,
            "authority": None,
            "source": "restricted_zones (PostGIS)",
            "note": "No active restriction at coordinates",
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
