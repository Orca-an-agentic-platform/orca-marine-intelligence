# ORCA — Marine EcOsystem Reasoning with Collaborative Agents
## Implementation Plan

> **Team TechnoCrakerz · SIH26176 · Disaster Management**
> Goal: Working prototype, not a mock chatbot. All marine/weather facts come from trusted data; the LLM only interprets, plans and explains.

---

## Phased Delivery Overview

| Phase | Focus | Outcome |
|---|---|---|
| **0** | Foundations & scaffolding | Repo, Docker, DB, auth skeleton |
| **1** | Data pipeline & storage | At least one real marine + one weather dataset flowing into the DB |
| **2** | Agent core | LangGraph orchestrator + 5 specialist agents wired to real data |
| **3** | RAG & knowledge | BGE-M3 + pgvector retrieval grounded on official documents |
| **4** | API & backend | FastAPI endpoints, Pydantic validation, Redis caching |
| **5** | Web dashboard | React/TypeScript conversational UI + MapLibre maps + Recharts |
| **6** | Proactive alerts | APScheduler hazard-alert pipeline |
| **7** | Mobile & offline | React Native app with offline cache |
| **8** | Hardening & demo | Security, monitoring, audit logs, load testing |

---

## Phase 0 — Foundations & Scaffolding

### Monorepo structure
```
orca/
├── backend/          # FastAPI + agents + pipeline
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── core/
│   │   ├── data/
│   │   ├── db/
│   │   └── rag/
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/         # React + TypeScript + Tailwind
│   ├── src/
│   └── Dockerfile
├── mobile/           # React Native
├── infra/
│   ├── docker-compose.yml
│   ├── prometheus/
│   └── grafana/
├── data/             # Raw ingested datasets (gitignored)
├── docs/
└── .github/workflows/
```

### Infrastructure (Docker Compose)
- **PostgreSQL 16** + **PostGIS 3** + **TimescaleDB** + **pgvector** — single image: `timescale/timescaledb-ha:pg16` (includes all extensions)
- **Redis 7** — caching, sessions, rate limiting
- **Ollama** — local Gemma 4 12B serving (development)
- **FastAPI** backend container
- **React** frontend container (Vite dev server)
- **Prometheus + Grafana** — observability stack

### Database setup
- Enable extensions: `CREATE EXTENSION postgis; CREATE EXTENSION timescaledb; CREATE EXTENSION vector;`
- Alembic for migrations
- Seed scripts for static geospatial data (coastline, MPA boundaries, ports)

### Auth skeleton
- OAuth2 password flow + JWT (access + refresh tokens)
- RBAC roles: `fisherman`, `authority`, `disaster_mgmt`, `researcher`, `admin`
- Pydantic schemas for all user/token models

---

## Phase 1 — Data Pipeline & Storage

### Schema design

#### `marine_observations` (TimescaleDB hypertable)
```sql
source TEXT, location GEOMETRY(Point,4326),
observed_at TIMESTAMPTZ, parameter TEXT,
value FLOAT, unit TEXT, quality_flag TEXT,
raw_metadata JSONB
```

#### `weather_observations` (TimescaleDB hypertable)
```sql
source TEXT, location GEOMETRY(Point,4326),
valid_time TIMESTAMPTZ, parameter TEXT,
value FLOAT, unit TEXT, forecast_hour INT,
raw_metadata JSONB
```

#### `pfz_zones` (PostGIS)
```sql
source TEXT, valid_date DATE,
zone_geom GEOMETRY(MultiPolygon,4326),
confidence TEXT, raw_metadata JSONB
```

#### `restricted_zones` (PostGIS)
```sql
zone_type TEXT, name TEXT, authority TEXT,
geom GEOMETRY(MultiPolygon,4326),
rules JSONB, effective_from DATE, effective_to DATE
```

#### `source_metadata`
```sql
source_id TEXT PK, name TEXT, category TEXT,
base_url TEXT, update_interval_minutes INT,
last_fetched_at TIMESTAMPTZ, last_success_at TIMESTAMPTZ,
freshness_status TEXT, coverage_geom GEOMETRY
```

#### `alerts`
```sql
alert_type TEXT, severity TEXT, affected_area GEOMETRY,
valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ,
source TEXT, message TEXT, raw JSONB
```

### Data connectors (backend/app/data/connectors/)

| Connector | Source | Data | Update |
|---|---|---|---|
| `incois_osf.py` | INCOIS Ocean State Forecast | Waves, currents, SST | 6h |
| `incois_pfz.py` | INCOIS PFZ WebGIS API | PFZ polygons | Daily |
| `imd_weather.py` | IMD open data / NWP grids | Wind, rain, pressure, cyclone | 3–6h |
| `mosdac_sst.py` | MOSDAC/ISRO | SST (NetCDF) | Daily |
| `mosdac_chl.py` | MOSDAC/ISRO | Chlorophyll (NetCDF) | Daily |
| `copernicus_cmems.py` | Copernicus Marine Service | Ocean state, currents | Daily |
| `tidal_model.py` | INCOIS tidal predictions | Tide height/time | On demand |

> **Note:** Verify each API endpoint before implementation. Use representative/sample datasets where official APIs are not yet accessible in dev. Clearly label representative data.

### Pipeline stages (backend/app/data/pipeline/)
1. **Fetch** — HTTP/FTP/S3 pull with retry + exponential backoff
2. **Validate** — schema check, spatial coverage, value-range sanity
3. **Freshness check** — update `source_metadata`; flag stale if beyond 2× update interval
4. **Parse** — NetCDF → xarray, GeoJSON → GeoPandas, CSV → Pandas
5. **Standardise** — normalise units, CRS to EPSG:4326, timestamps to UTC
6. **Ingest** — upsert into PostgreSQL/TimescaleDB with source + quality metadata
7. **Tile/cache** — pre-compute map tiles or bounding-box extracts for common regions

### Scheduler
- APScheduler with cron triggers per connector
- Dead-letter log for failed fetches
- Freshness dashboard endpoint (`/data/freshness`)

---

## Phase 2 — Agent Core (LangGraph)

### Model abstraction (backend/app/core/llm.py)
```python
class LLMProvider(Protocol):
    def chat(self, messages, tools) -> ChatResponse: ...

class OllamaProvider(LLMProvider): ...   # dev
class VLLMProvider(LLMProvider): ...     # prod
```
Swap via `LLM_PROVIDER` env var. Primary: Gemma 4 12B. Fallback: Qwen3-8B.

### LangGraph state schema
```python
class ORCAState(TypedDict):
    query: str
    intent: IntentModel          # location, time, user_role, query_type
    sub_tasks: list[Task]
    agent_results: dict[str, AgentResult]
    risk_assessment: RiskModel
    advisory: AdvisoryModel
    evidence: list[EvidenceItem]  # source, timestamp, value, quality
    warnings: list[str]
    map_layers: list[MapLayer]
    session_id: str
    audit_log: list[AuditEntry]
```

### Agent implementations (backend/app/agents/)

#### `orchestrator.py` — ORCA Planner
- Parses query with structured output (Pydantic `IntentModel`)
- Extracts: location (geocode if named place), time window, user role hint, query type
- Decomposes into sub-tasks; selects which specialist agents to invoke
- Merges agent outputs; routes to Risk + Advisory agents
- Writes audit log entry for every decision

#### `marine_agent.py` — Marine Intelligence
**Tools:**
- `get_sst(bbox, time_range)` → PostGIS/TimescaleDB query
- `get_chlorophyll(bbox, time_range)` → same
- `get_pfz_zones(bbox, date)` → pfz_zones table
- `get_currents(location, time)` → ocean state forecast
- `get_ocean_observations(location, radius_km, time_range)` → buoy/Argo data
- `check_freshness(source_id)` → source_metadata

#### `weather_agent.py` — Weather & Hazard
**Tools:**
- `get_forecast(location, time_range, parameters)` → IMD/NWP grid lookup
- `get_active_cyclones()` → RSMC/IMD cyclone feed
- `get_wave_height(location, time_range)` → INCOIS OSF
- `get_lightning_risk(bbox, time)` → IMD lightning
- `get_storm_surge_risk(location)` → INCOIS storm surge
- `get_active_warnings(location)` → IMD/INCOIS warnings

#### `geo_agent.py` — Geo-Spatial
**Tools:**
- `geocode(place_name)` → coordinates (Nominatim or Bhuvan)
- `check_restricted_zones(route_geom)` → PostGIS intersection
- `check_mpa_overlap(location, radius_km)` → MPA polygon lookup
- `compute_route(origin, destination, constraints)` → routing with geofence avoidance
- `get_bathymetry(location)` → depth data
- `get_nearest_port(location)` → ports table

#### `risk_agent.py` — Risk Assessment
- Aggregates all agent results into a structured `RiskModel`
- Applies deterministic rules (restricted zone = hard block; active cyclone warning = red)
- Outputs risk level: `LOW / MODERATE / HIGH / CRITICAL`
- Always separates retrieved facts from model interpretation
- Never outputs "guaranteed safe" — uses probabilistic language
- Appends evidence list with source + timestamp for every claim

#### `advisory_agent.py` — Advisory
- Turns `RiskModel` into human-readable, role-specific guidance
- Multilingual output routing (Hindi/Marathi/Tamil etc. via translation layer)
- Surfaces official warnings as authoritative
- Appends "limitations" section (stale data, missing sources, model uncertainty)
- Generates map layer spec for UI

#### `knowledge_agent.py` — Knowledge/RAG
- Hybrid retrieval: pgvector semantic + keyword BM25 fallback
- Sources: INCOIS advisories, regulations, safety rules, fishing laws, domain reports
- Returns retrieved chunks with document name, date, jurisdiction
- Used by advisory + risk agents for regulatory grounding

---

## Phase 3 — RAG & Knowledge Base

### Document ingestion pipeline (backend/app/rag/)
1. **Parsers** — PDF (PyMuPDF), HTML, DOCX, plain text
2. **Chunker** — semantic chunking (512 tokens, 64 overlap)
3. **Embedder** — BGE-M3 via sentence-transformers (multilingual)
4. **Store** — pgvector table `document_chunks(id, doc_id, chunk_text, embedding vector(1024), metadata JSONB)`
5. **Index** — HNSW index on embedding column

### Document schema (`documents` table)
```sql
id UUID PK, title TEXT, source TEXT, jurisdiction TEXT,
doc_type TEXT, language TEXT, published_date DATE,
ingested_at TIMESTAMPTZ, url TEXT, content_hash TEXT
```

### Initial document corpus
- INCOIS marine safety advisories
- IMD cyclone/weather warnings (archived + current)
- Indian fishing zone regulations
- MPA/restricted zone official notifications
- NDMA marine disaster management guidelines
- IMSAS/DGS circulars relevant to small vessel safety

### Retrieval strategy
- Query embedding → top-K pgvector ANN search (cosine similarity)
- Metadata filters: jurisdiction, doc_type, date range
- Rerank top results (cross-encoder or LLM-based)
- Inject as grounded context into agent prompt
- Always return source + date with each retrieved chunk

---

## Phase 4 — API Layer

### FastAPI modules (backend/app/api/)

```
/auth
  POST /auth/token
  POST /auth/refresh
  POST /auth/register

/chat
  POST /chat/query          ← main entry point; streams SSE response
  GET  /chat/history/{session_id}

/orchestrator
  POST /orchestrator/run    ← internal; called by /chat

/marine
  GET  /marine/sst
  GET  /marine/chlorophyll
  GET  /marine/pfz
  GET  /marine/currents
  GET  /marine/observations

/weather
  GET  /weather/forecast
  GET  /weather/warnings
  GET  /weather/cyclones
  GET  /weather/waves

/geo
  GET  /geo/geocode
  GET  /geo/restricted-zones
  POST /geo/route
  GET  /geo/ports

/risk
  POST /risk/assess         ← returns structured RiskModel

/advisory
  POST /advisory/generate   ← returns structured advisory

/alerts
  GET  /alerts/active
  POST /alerts/subscribe
  GET  /alerts/history

/data
  GET  /data/freshness      ← per-source freshness dashboard
  GET  /data/sources

/knowledge
  POST /knowledge/search

/vessels
  GET  /vessels/nearby      ← AIS integration (future)
  POST /vessels/track

/health
  GET  /health              ← liveness
  GET  /health/ready        ← readiness (DB, Redis, LLM)
```

### Cross-cutting concerns
- **Pydantic v2** for all request/response models
- **Redis** rate limiting per user/IP (`slowapi`)
- **Server-Sent Events** for streaming agent responses
- **Audit middleware** — log user, endpoint, query hash, agent path, data sources used
- **Freshness middleware** — attach `X-Data-Freshness` header to all data responses
- **CORS** configured for frontend origin

---

## Phase 5 — Web Dashboard (React + TypeScript)

### Tech
- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (as specified)
- **MapLibre GL JS** — primary marine map
- **Recharts** — data visualisation
- **Zustand** — client state
- **TanStack Query** — data fetching + caching
- **EventSource API** — SSE streaming from `/chat/query`

### Core components

#### Conversational interface
- Chat pane with streaming token display
- Voice input (Web Speech API) — incremental
- Language selector (EN / HI / regional)
- Query suggestions based on user role

#### Map panel (MapLibre GL JS)
Layers (toggleable):
- SST heatmap (raster)
- Chlorophyll / PFZ polygons (GeoJSON)
- Wind vectors (animated)
- Wave height contours
- Active hazard zones (red overlays)
- Restricted / MPA zones (hatched)
- Vessel positions (dots — AIS, future)
- Route line with geofence avoidance

#### Condition cards
- Sea state, wave height, wind speed/dir, visibility
- SST, chlorophyll index, PFZ confidence
- Tide table for next 24h
- Active warnings badge

#### Risk summary panel
- Risk level badge (LOW / MODERATE / HIGH / CRITICAL)
- Evidence list (source + timestamp for every fact)
- Limitations/uncertainty disclosure
- Timestamp of data freshness

#### Alert centre
- Active hazard alerts (colour-coded by severity)
- Alert history
- Subscribe to location-based alerts

#### Source/evidence panel
- Expandable per-claim evidence drawer
- Data source name, fetch time, quality flag
- Raw data link where available

### Pages / routes
```
/           → dashboard (map + chat)
/alerts     → alert centre
/route      → route planner
/conditions → detailed conditions for a location
/profile    → user settings, saved locations
/admin      → data source health, user management (admin only)
```

---

## Phase 6 — Proactive Hazard Alerts

### Alert pipeline (APScheduler)
```
Every 15 min:
  for each monitored_location in alert_subscriptions:
    → run mini-orchestration (Weather + Geo + Risk agents)
    → if risk level ≥ MODERATE and changed from last check:
        → create alert record
        → push via FCM (mobile) + WebSocket (web) + SMS/email API
```

### Alert types
- Cyclone track entering monitored zone
- Wave height > threshold
- Lightning risk elevated
- Restricted zone approaching (for vessel tracking)
- Stale data warning (data freshness > 2× update interval)
- PFZ zone shift

### Alert schema
```python
class Alert(BaseModel):
    alert_id: UUID
    alert_type: AlertType
    severity: Severity          # INFO / WARNING / DANGER / CRITICAL
    affected_geom: GeoJSON
    valid_from: datetime
    valid_to: datetime
    source: str
    message: str                # localised
    evidence: list[EvidenceItem]
    official_warning_ref: str | None
```

---

## Phase 7 — Mobile & Offline (React Native)

### Key capabilities
- Same conversational interface, optimised for small screen
- MapLibre GL React Native for offline map tiles
- **Offline cache:**
  - Last 48h advisories for saved locations
  - Active restricted zones (PostGIS export → GeoJSON file)
  - Tide predictions for 7 days ahead (precomputed at sync)
  - Last known PFZ for nearest zone
- Offline-state banner: "Showing data from [timestamp] — no connection"
- Never label stale data as current
- Background sync on reconnect (non-critical events queued)
- Voice input (native TTS/STT)
- FCM push notifications for alerts

### Platforms
- iOS + Android via React Native (Expo managed workflow initially)

---

## Phase 8 — Hardening & Demo Prep

### Security checklist
- [ ] Secrets via environment variables / Docker secrets (never in source)
- [ ] HTTPS/TLS on all external endpoints
- [ ] JWT expiry + refresh token rotation
- [ ] RBAC enforced at API middleware level
- [ ] Pydantic input validation on every endpoint
- [ ] Redis rate limiting per user + per IP
- [ ] SQL injection prevention (ORM / parameterised queries only)
- [ ] Audit logs for all safety-critical recommendation paths
- [ ] Dependency scanning (pip-audit / Dependabot)

### Observability
- Prometheus metrics: request latency, agent execution time, data freshness lag, LLM token usage, cache hit rate
- Grafana dashboards: system health, data pipeline status, alert volume
- Structured JSON logging (structlog)
- Health + readiness endpoints consumed by Docker Compose healthcheck

### Safety guardrails (audit)
- [ ] No "guaranteed safe" language in any advisory output
- [ ] Official warnings always surfaced as authoritative
- [ ] Every data-backed claim has source + timestamp in evidence list
- [ ] Stale data explicitly disclosed
- [ ] Geofence restricted zone checks are deterministic (no LLM override)
- [ ] Human confirmation prompt for high-consequence route submissions

---

## Open Questions

> [!IMPORTANT]
> **API access**: Which INCOIS / MOSDAC / IMD APIs have confirmed access for the team? The pipeline design assumes HTTP/REST or FTP access. If APIs are gated, representative sample datasets (clearly labelled) will be used for the prototype demo and replaced with live feeds as access is granted.

> [!IMPORTANT]
> **Hardware for LLM**: Is local GPU available for Ollama + Gemma 4 12B (requires ~10–12 GB VRAM)? If not, the plan should shift to Qwen3-8B or a cloud-hosted LLM endpoint for the prototype.

> [!WARNING]
> **AIS vessel data**: AIS integration is listed under `/vessels`. Real-time AIS requires a licensed feed (e.g., MarineTraffic, exactEarth). For MVP, this will be mocked unless a specific source is confirmed.

> [!NOTE]
> **Multilingual priority**: Which regional languages should be supported in the MVP? Full translation (BGE-M3 retrieval handles multilingual embedding; advisory output translation can use a lightweight NMT model or API).

> [!NOTE]
> **Mobile in MVP demo**: Is the React Native app required for the first SIH demo, or is the web dashboard sufficient for MVP evaluation?

---

## Verification Plan

### Automated tests
```bash
# Backend
pytest backend/tests/ -v --cov=app

# API integration
pytest backend/tests/integration/ -v   # requires running DB + Redis

# Agent unit tests (mocked LLM + tools)
pytest backend/tests/agents/ -v
```

### End-to-end smoke test
1. POST `/chat/query` → "Is it safe to fish near Ratnagiri tomorrow morning?"
2. Verify: orchestrator decomposes, all 5 agents execute, risk model populated, advisory returned with evidence list + timestamp
3. Verify: map layer spec contains at least SST + PFZ + weather layer
4. Verify: no "guaranteed safe" in advisory text
5. Verify: data freshness headers present

### Manual demo checklist
- [ ] Streaming chat response visible in UI within 3s of query
- [ ] Map renders SST + PFZ layer for query location
- [ ] Risk badge shows correct severity
- [ ] Evidence panel shows source name + timestamp for each claim
- [ ] Active hazard alert fires for a simulated cyclone scenario
- [ ] Offline banner appears when network is cut (mobile)
- [ ] Restricted zone returns hard block on route planner
- [ ] `/health/ready` returns 200 with DB + Redis + LLM status

---

## Execution Order (Sprint Mapping)

| Sprint | Phases | Key deliverable |
|---|---|---|
| S1 (Week 1–2) | 0 | Repo, Docker Compose, DB up, auth working |
| S2 (Week 3–4) | 1 | ≥1 real marine dataset + 1 weather dataset ingested, freshness endpoint live |
| S3 (Week 5–6) | 2 | LangGraph orchestrator + all 5 agents wired to real data; basic CLI test |
| S4 (Week 7) | 3 | RAG pipeline with official doc corpus; knowledge agent integrated |
| S5 (Week 8) | 4 | All FastAPI endpoints, SSE streaming, Pydantic schemas, Redis caching |
| S6 (Week 9–10) | 5 | React dashboard: chat UI + map + condition cards + evidence panel |
| S7 (Week 11) | 6 | APScheduler alert pipeline; FCM integration |
| S8 (Week 12) | 7, 8 | React Native MVP + offline cache; security hardening; demo dry run |
