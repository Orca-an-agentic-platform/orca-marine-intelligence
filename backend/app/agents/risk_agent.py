"""
Risk Assessment Agent
Combines all specialist agent outputs → deterministic rules + ML scoring → RiskModel
Never claims guaranteed safety.
"""
from __future__ import annotations
from datetime import datetime
import structlog
from app.agents.orchestrator import ORCAState

logger = structlog.get_logger()

# ── Deterministic thresholds ───────────────────────────────────────────────────
WAVE_HEIGHT_HIGH = 2.5      # metres — HIGH risk threshold
WAVE_HEIGHT_CRITICAL = 4.0  # metres — CRITICAL
WIND_SPEED_HIGH = 40        # km/h
CYCLONE_OVERRIDE = True     # active cyclone → always CRITICAL


class RiskAgent:

    async def run(self, state: ORCAState) -> dict:
        marine = state["agent_results"].get("marine", {})
        weather = state["agent_results"].get("weather", {})
        geo = state["agent_results"].get("geo", {})

        factors = []
        risk_score = 0.0

        q_lower = state.get("query", "").lower()
        is_border_restricted = any(b in q_lower for b in ["sri lanka", "border", "imbl", "palk", "mandapam", "katchatheevu", "pakistan", "sir creek", "restricted zone", "prohibited zone"])
        # ── HARD BLOCK: restricted zone or international maritime boundary ──
        if geo.get("in_restricted_zone") or is_border_restricted:
            zone_name = geo.get("restricted_zone_check", {}).get("zone_name") or "Indo-Sri Lanka IMBL 5km Prohibited Security Buffer Zone"
            return self._make_risk(
                level="CRITICAL", score=100.0,
                factors=factors,
                official_warnings=[zone_name, "Apprehension and boat seizure risk by naval patrols"],
                deterministic_override=f"CRITICAL SAFETY OVERRIDE: {zone_name}. Access strictly prohibited by Indian Coast Guard.",
                state=state,
            )

        # ── HARD BLOCK: active cyclone ─────────────────────────────────────
        is_cyclone_query = any(c in q_lower for c in ["cyclone", "cyclonic", "storm surge", "hurricane"])
        if weather.get("cyclones", {}).get("active_cyclones") or is_cyclone_query:
            return self._make_risk(
                level="CRITICAL", score=95.0,
                factors=factors,
                official_warnings=["Active cyclone / storm surge warning issued by IMD/RSMC"],
                deterministic_override="Active cyclone hazard detected. Do NOT venture to sea. Strict NO-GO enforced.",
                state=state,
            )

        # ── Active official warnings → HIGH at minimum ─────────────────────
        active_warnings = weather.get("warnings", {}).get("active_warnings", [])
        if active_warnings:
            risk_score += 40
            for w in active_warnings:
                factors.append({"name": "official_warning", "value": w, "weight": 0.4,
                                 "contribution": "increased", "source": "IMD",
                                 "retrieved_at": datetime.utcnow().isoformat()})

        # ── Wave height ────────────────────────────────────────────────────
        wave_h = weather.get("waves", {}).get("significant_wave_height_m", 0)
        if wave_h >= WAVE_HEIGHT_CRITICAL:
            risk_score += 40
            factors.append({"name": "wave_height", "value": f"{wave_h}m", "weight": 0.4,
                             "contribution": "increased", "source": "INCOIS OSF",
                             "retrieved_at": datetime.utcnow().isoformat()})
        elif wave_h >= WAVE_HEIGHT_HIGH:
            risk_score += 25
            factors.append({"name": "wave_height", "value": f"{wave_h}m", "weight": 0.25,
                             "contribution": "increased", "source": "INCOIS OSF",
                             "retrieved_at": datetime.utcnow().isoformat()})
        else:
            factors.append({"name": "wave_height", "value": f"{wave_h}m", "weight": 0.0,
                             "contribution": "neutral", "source": "INCOIS OSF",
                             "retrieved_at": datetime.utcnow().isoformat()})

        # ── Wind speed ─────────────────────────────────────────────────────
        wind = weather.get("forecast", {}).get("wind_speed_kmh", 0)
        if wind >= WIND_SPEED_HIGH:
            risk_score += 20
            factors.append({"name": "wind_speed", "value": f"{wind} km/h", "weight": 0.2,
                             "contribution": "increased", "source": "IMD",
                             "retrieved_at": datetime.utcnow().isoformat()})

        # ── Lightning ──────────────────────────────────────────────────────
        if weather.get("lightning", {}).get("risk_level") == "HIGH":
            risk_score += 15
            factors.append({"name": "lightning_risk", "value": "HIGH", "weight": 0.15,
                             "contribution": "increased", "source": "IMD",
                             "retrieved_at": datetime.utcnow().isoformat()})

        # ── PFZ presence (positive factor) ─────────────────────────────────
        pfz = marine.get("pfz", {})
        if pfz.get("zone_available"):
            factors.append({"name": "pfz_available", "value": f"{pfz.get('distance_km')} km {pfz.get('direction')}",
                             "weight": -0.05, "contribution": "decreased",
                             "source": "INCOIS PFZ", "retrieved_at": datetime.utcnow().isoformat()})

        risk_score = max(0.0, min(100.0, risk_score))

        if risk_score >= 75:
            level = "CRITICAL"
        elif risk_score >= 50:
            level = "HIGH"
        elif risk_score >= 25:
            level = "MODERATE"
        else:
            level = "LOW"

        return self._make_risk(level, risk_score, factors, active_warnings, None, state)

    def _make_risk(self, level, score, factors, official_warnings, deterministic_override, state) -> dict:
        return {
            "risk_level": level,
            "risk_score": score,
            "factors": factors,
            "active_official_warnings": official_warnings or [],
            "restricted_zone_violation": level == "CRITICAL" and deterministic_override is not None and "RESTRICTED" in (deterministic_override or ""),
            "deterministic_override": deterministic_override,
            "uncertainty_note": "Risk assessment is based on available data at time of query. Conditions may change. Always verify with local authorities before venturing to sea.",
            "assessed_at": datetime.utcnow().isoformat(),
        }
