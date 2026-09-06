"""
Weather & Hazard Agent
Handles: Wind, Rain, Pressure, Waves, Cyclones, Lightning, Storm Surge, Warnings
"""
from __future__ import annotations
from datetime import datetime
import structlog
from app.core.llm import llm, ChatMessage
from app.agents.orchestrator import ORCAState, SYSTEM_PROMPT

logger = structlog.get_logger()


class WeatherAgent:

    async def run(self, state: ORCAState) -> dict:
        intent = state.get("intent", {})
        location_raw = intent.get("location_raw")

        forecast = await self._get_forecast(location_raw)
        waves = await self._get_waves(location_raw)
        warnings = await self._get_active_warnings(location_raw)
        cyclones = await self._get_cyclones()
        lightning = await self._get_lightning_risk(location_raw)

        interpretation = f"Forecast: {forecast.get('wind_speed_kmh')} km/h {forecast.get('wind_direction')} wind, {forecast.get('visibility_km')} km visibility. Waves: {waves.get('significant_wave_height_m')} m. Warnings: {warnings.get('active_warnings')}."

        has_active_warnings = bool(warnings.get("active_warnings"))
        has_cyclone = cyclones.get("active_cyclones", False)

        return {
            "forecast": forecast,
            "waves": waves,
            "warnings": warnings,
            "cyclones": cyclones,
            "lightning": lightning,
            "interpretation": interpretation,
            "has_active_official_warning": has_active_warnings or has_cyclone,
            "retrieved_at": datetime.utcnow().isoformat(),
            "sources": ["IMD", "INCOIS OSF", "RSMC New Delhi"],
        }

    async def _get_forecast(self, location: str | None) -> dict:
        return {
            "wind_speed_kmh": 22, "wind_direction": "SW",
            "rainfall_mm_24h": 5, "visibility_km": 8,
            "pressure_hpa": 1008, "temperature_c": 29,
            "source": "IMD", "valid_for": "next 24 hours",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample — replace with live IMD API",
            "quality_flag": "sample",
        }

    async def _get_waves(self, location: str | None) -> dict:
        return {
            "significant_wave_height_m": 1.8, "period_s": 8,
            "swell_direction": "W", "source": "INCOIS OSF",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample — replace with live INCOIS OSF API",
            "quality_flag": "sample",
        }

    async def _get_active_warnings(self, location: str | None) -> dict:
        return {
            "active_warnings": [],  # empty → no current warning
            "source": "IMD",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample — connect to live IMD warning feed",
        }

    async def _get_cyclones(self) -> dict:
        return {
            "active_cyclones": False,
            "source": "RSMC New Delhi / IMD",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample — connect to live IMD cyclone feed",
        }

    async def _get_lightning_risk(self, location: str | None) -> dict:
        return {
            "risk_level": "LOW",
            "source": "IMD Lightning Detection Network",
            "retrieved_at": datetime.utcnow().isoformat(),
            "note": "Representative sample — connect to live IMD lightning API",
        }
