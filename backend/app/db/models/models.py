"""
SQLAlchemy ORM Models — ORCA Database
PostgreSQL + PostGIS + TimescaleDB + pgvector
"""
from __future__ import annotations
import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ── Users & Auth ───────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="fisherman")
    language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    saved_locations = relationship("SavedLocation", back_populates="user")
    alert_subscriptions = relationship("AlertSubscription", back_populates="user")
    feedback = relationship("Feedback", back_populates="user")


class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(Geometry("Point", srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_locations")


# ── Marine Observations (TimescaleDB hypertable) ───────────────────────────────

class MarineObservation(Base):
    __tablename__ = "marine_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False, index=True)
    location = Column(Geometry("Point", srid=4326), nullable=True)
    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    parameter = Column(String(100), nullable=False)   # sst | chlorophyll | current_u | ...
    value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    quality_flag = Column(String(20), default="unknown")
    raw_metadata = Column(JSONB, default=dict)


# ── Weather Observations (TimescaleDB hypertable) ──────────────────────────────

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False, index=True)
    location = Column(Geometry("Point", srid=4326), nullable=True)
    valid_time = Column(DateTime(timezone=True), nullable=False, index=True)
    parameter = Column(String(100), nullable=False)   # wind_speed | wave_height | rainfall | ...
    value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    forecast_hour = Column(Integer, nullable=True)
    raw_metadata = Column(JSONB, default=dict)


# ── PFZ Zones (PostGIS) ────────────────────────────────────────────────────────

class PFZZone(Base):
    __tablename__ = "pfz_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False)
    valid_date = Column(Date, nullable=False, index=True)
    zone_geom = Column(Geometry("MultiPolygon", srid=4326), nullable=False)
    confidence = Column(String(20), default="medium")
    raw_metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Restricted Zones (PostGIS) ─────────────────────────────────────────────────

class RestrictedZone(Base):
    __tablename__ = "restricted_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_type = Column(String(50), nullable=False)    # MPA | fishing_ban | military | ...
    name = Column(String(255), nullable=False)
    authority = Column(String(255))
    geom = Column(Geometry("MultiPolygon", srid=4326), nullable=False)
    rules = Column(JSONB, default=dict)
    effective_from = Column(Date)
    effective_to = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Vessels — AIS (TimescaleDB hypertable) ─────────────────────────────────────

class VesselPosition(Base):
    __tablename__ = "vessel_positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mmsi = Column(String(20), nullable=False, index=True)
    vessel_name = Column(String(255))
    vessel_type = Column(String(100))
    location = Column(Geometry("Point", srid=4326), nullable=False)
    speed = Column(Float)
    heading = Column(Float)
    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    raw_metadata = Column(JSONB, default=dict)


# ── Alerts ─────────────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    affected_area = Column(Geometry("MultiPolygon", srid=4326), nullable=True)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_to = Column(DateTime(timezone=True), nullable=True)
    source = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    official_warning_ref = Column(String(255))
    raw = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    location = Column(Geometry("Point", srid=4326), nullable=False)
    radius_km = Column(Float, default=50.0)
    min_severity = Column(String(20), default="WARNING")
    fcm_token = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="alert_subscriptions")


# ── Source Metadata / Freshness ────────────────────────────────────────────────

class SourceMetadata(Base):
    __tablename__ = "source_metadata"

    source_id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))            # marine | weather | tides | gis | advisory
    base_url = Column(String(500))
    update_interval_minutes = Column(Integer, default=360)
    last_fetched_at = Column(DateTime(timezone=True))
    last_success_at = Column(DateTime(timezone=True))
    freshness_status = Column(String(20), default="unknown")
    coverage_geom = Column(Geometry("MultiPolygon", srid=4326), nullable=True)
    notes = Column(Text)


# ── Ports ──────────────────────────────────────────────────────────────────────

class Port(Base):
    __tablename__ = "ports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    country = Column(String(100), default="India")
    state = Column(String(100))
    port_type = Column(String(50))           # major | minor | fishing_harbour
    location = Column(Geometry("Point", srid=4326), nullable=False)
    facilities = Column(JSONB, default=dict)


# ── Catch Records (Fisheries) ──────────────────────────────────────────────────

class CatchRecord(Base):
    __tablename__ = "catch_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fisher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    vessel_id = Column(UUID(as_uuid=True), nullable=True)
    location = Column(Geometry("Point", srid=4326), nullable=True)
    catch_date = Column(Date, nullable=False, index=True)
    species = Column(String(255), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    market_price_per_kg = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Market Prices (Marketplace) ────────────────────────────────────────────────

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    species = Column(String(255), nullable=False, index=True)
    port = Column(String(255), nullable=False)
    price_per_kg = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)
    source = Column(String(100))
    raw_metadata = Column(JSONB, default=dict)


# ── RAG Documents ──────────────────────────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    source = Column(String(255), nullable=False)
    jurisdiction = Column(String(255))
    doc_type = Column(String(100))            # advisory | regulation | safety | report
    language = Column(String(10), default="en")
    published_date = Column(Date)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    url = Column(String(1000))
    content_hash = Column(String(64), unique=True)

    chunks = relationship("DocumentChunk", back_populates="document")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(1024))         # BGE-M3 dimension
    chunk_metadata = Column(JSONB, default=dict)   # renamed: 'metadata' is reserved by DeclarativeBase

    document = relationship("Document", back_populates="chunks")
    __table_args__ = (UniqueConstraint("doc_id", "chunk_index"),)


# ── Chat Sessions ──────────────────────────────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user_role = Column(String(50))
    language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    messages = Column(JSONB, default=list)
    audit_log = Column(JSONB, default=list)


# ── Feedback Loop ──────────────────────────────────────────────────────────────

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rating = Column(Integer)                  # 1–5
    was_accurate = Column(Boolean)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="feedback")
