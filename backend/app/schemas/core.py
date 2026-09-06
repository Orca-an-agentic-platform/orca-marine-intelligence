"""
Pydantic v2 Schemas — Core ORCA data models
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    fisherman = "fisherman"
    coastal_authority = "coastal_authority"
    disaster_management = "disaster_management"
    maritime_operator = "maritime_operator"
    researcher = "researcher"
    institutional_researcher = "institutional_researcher"
    shipping_operator = "shipping_operator"
    fisheries_dept = "fisheries_dept"
    marketplace = "marketplace"
    admin = "admin"


class RiskLevel(str, Enum):
    low = "LOW"
    moderate = "MODERATE"
    high = "HIGH"
    critical = "CRITICAL"


class AlertSeverity(str, Enum):
    info = "INFO"
    warning = "WARNING"
    danger = "DANGER"
    critical = "CRITICAL"


class AlertType(str, Enum):
    cyclone = "cyclone"
    high_waves = "high_waves"
    lightning = "lightning"
    storm_surge = "storm_surge"
    restricted_zone = "restricted_zone"
    pfz_shift = "pfz_shift"
    data_stale = "data_stale"
    general_hazard = "general_hazard"


class FreshnessStatus(str, Enum):
    fresh = "fresh"
    stale = "stale"
    failed = "failed"
    unknown = "unknown"


# ── Location ───────────────────────────────────────────────────────────────────

class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None
    accuracy_m: Optional[float] = None


# ── Evidence ───────────────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    claim: str
    source: str
    source_url: Optional[str] = None
    retrieved_at: datetime
    valid_for: Optional[str] = None        # e.g. "2026-09-07 06:00–12:00 IST"
    quality_flag: Optional[str] = None
    is_official_warning: bool = False


# ── Intent ─────────────────────────────────────────────────────────────────────

class IntentModel(BaseModel):
    query_type: str                        # fishing_safety | pfz | weather | hazard | route | historical | ...
    location: Optional[Location] = None
    location_raw: Optional[str] = None    # raw place name if not yet geocoded
    time_window_start: Optional[datetime] = None
    time_window_end: Optional[datetime] = None
    user_role: UserRole = UserRole.fisherman
    language: str = "en"
    constraints: dict[str, Any] = Field(default_factory=dict)


# ── Risk ───────────────────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    name: str
    value: Any
    weight: float
    contribution: str                      # "increased" | "decreased" | "neutral"
    source: str
    retrieved_at: datetime


class RiskModel(BaseModel):
    risk_level: RiskLevel
    risk_score: float = Field(..., ge=0, le=100)
    factors: list[RiskFactor]
    active_official_warnings: list[str]
    restricted_zone_violation: bool = False
    deterministic_override: Optional[str] = None  # if hard rule fired
    uncertainty_note: Optional[str] = None
    assessed_at: datetime = Field(default_factory=datetime.utcnow)


# ── Advisory ───────────────────────────────────────────────────────────────────

class MapLayer(BaseModel):
    layer_id: str
    layer_type: str                        # raster | geojson | vector
    title: str
    source_url: Optional[str] = None
    data: Optional[dict] = None            # inline GeoJSON for small payloads
    visible_by_default: bool = True
    legend: Optional[dict] = None


class AdvisoryModel(BaseModel):
    summary: str                           # 1–2 sentence answer
    detailed_guidance: str                 # full advisory text
    precautions: list[str]
    limitations: list[str]                 # uncertainty / missing data / stale sources
    official_warnings: list[str]
    go_no_go: Optional[str] = None        # "GO" | "NO-GO" | "CAUTION" — fisherman only
    confidence_score: float = Field(..., ge=0, le=1)
    language: str = "en"
    evidence: list[EvidenceItem]
    map_layers: list[MapLayer]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    location: Optional[Location] = None
    language: str = "en"
    user_role: UserRole = UserRole.fisherman


class ChatQueryResponse(BaseModel):
    session_id: str
    advisory: AdvisoryModel
    risk: RiskModel
    intent: IntentModel


# ── Alert ──────────────────────────────────────────────────────────────────────

class AlertModel(BaseModel):
    alert_id: UUID = Field(default_factory=uuid4)
    alert_type: AlertType
    severity: AlertSeverity
    affected_area_geojson: Optional[dict] = None
    valid_from: datetime
    valid_to: Optional[datetime] = None
    source: str
    message: str
    official_warning_ref: Optional[str] = None
    evidence: list[EvidenceItem]
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Data Freshness ─────────────────────────────────────────────────────────────

class SourceFreshness(BaseModel):
    source_id: str
    name: str
    category: str
    last_fetched_at: Optional[datetime]
    last_success_at: Optional[datetime]
    freshness_status: FreshnessStatus
    update_interval_minutes: int
    age_minutes: Optional[float]


# ── Feedback ───────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    session_id: str
    rating: int = Field(..., ge=1, le=5)
    was_accurate: Optional[bool] = None
    comment: Optional[str] = None
