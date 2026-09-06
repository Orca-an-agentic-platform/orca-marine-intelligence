# 🐋 ORCA — Marine EcOsystem Reasoning with Collaborative Agents

> **SIH26176 · Disaster Management · Team TechnoCrakerz**  
> *Reliable Decisions. Safer Operations. Stronger Impact.*

ORCA is an intelligence layer between users and trusted marine data. It understands natural-language/voice queries, extracts intent, plans work, calls specialist agents, retrieves validated data, performs spatial-temporal reasoning, applies safety rules and returns evidence-backed answers with maps, charts and alerts.

---

## User Roles & Dashboards

| Role | Dashboard | Key Features |
|---|---|---|
| Fisherman | `/fisherman` | PFZ, Go/No-Go, voice, offline, multilingual |
| Coastal Authority | `/authority` | Vessel tracking, geofencing, incident management |
| Disaster Management | `/disaster` | Hazard + vessel intel, response prioritisation |
| Maritime Operator | `/maritime` | Route planner, sea-state scheduling |
| Researcher | `/research` | Time-series explorer, data export |
| Shipping Operator | `/shipping` | Port conditions, route optimisation |
| Fisheries Dept | `/fisheries` | Zone compliance, fleet analytics |
| Marketplace | `/marketplace` | Catch prices, demand forecast |
| Marine Analysis | `/analysis` | Full data layer explorer |
| Marine Logistics | `/logistics` | Port ops, vessel scheduling |

---

## Architecture

```
Users → Data Ingestion → ORCA Intelligence Core (LangGraph Multi-Agent)
          └─ Satellite (MOSDAC, Copernicus, NASA)        └─ Orchestrator / Planner
          └─ Weather (IMD, ECMWF, GFS)                   └─ Weather Agent
          └─ Tides & Currents (INCOIS)                   └─ Marine Agent
          └─ AIS / Vessel Tracking                       └─ Risk/Hazard Agent
          └─ GIS & Bathymetry (Bhuvan)                   └─ GeoSpatial Agent
          └─ Marine Advisories (INCOIS, NOTAM)           └─ Advisory Agent
          └─ Historical Data                             └─ Knowledge/RAG Agent
       → Decision & Alert Layer → Delivery Layer
          └─ Risk Scoring             └─ Web Dashboards (React)
          └─ Route & Geofence        └─ Mobile App (React Native)
          └─ Confidence Advisory     └─ SMS / FCM / Voice
       → Feedback Loop (continuous improvement)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web UI | React 18 + TypeScript + Tailwind CSS |
| Maps | MapLibre GL JS |
| Charts | Recharts |
| Mobile | React Native (Expo) |
| Backend | FastAPI + Python 3.11 |
| Orchestration | LangGraph |
| Agent tools | LangChain |
| Primary LLM | Gemma 4 12B (Ollama dev / vLLM prod) |
| Fallback LLM | Qwen3-8B |
| Embeddings | BGE-M3 |
| Database | PostgreSQL 16 + PostGIS + TimescaleDB + pgvector |
| Cache | Redis 7 |
| Scientific data | xarray + NetCDF4 |
| Geo processing | GeoPandas + Shapely + GDAL + Rasterio |
| Jobs | APScheduler → Celery |
| Notifications | FCM + SMS/email |
| Auth | OAuth2 + JWT + RBAC |
| Containers | Docker + Docker Compose |
| Monitoring | Prometheus + Grafana |

---

## Quick Start

### Prerequisites
- Docker Desktop
- Git

### 1. Clone and configure
```bash
git clone https://github.com/Orca-an-agentic-platform/orca-marine-intelligence.git
cd orca-marine-intelligence
cp .env.example .env
# Edit .env with your API keys
```

### 2. Pull Gemma 4 12B (after Docker starts)
```bash
docker exec -it orca_ollama ollama pull gemma2:12b
```

### 3. Start all services
```bash
docker compose up -d
```

### 4. Access
| Service | URL |
|---|---|
| Web Dashboard | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

---

## Project Structure

```
orca-marine-intelligence/
├── backend/                    # FastAPI + LangGraph agents
│   └── app/
│       ├── agents/             # Orchestrator + 6 specialist agents
│       ├── api/routes/         # All FastAPI route modules
│       ├── core/               # Config, LLM abstraction, security
│       ├── data/               # Connectors + pipeline
│       ├── db/                 # SQLAlchemy models + migrations
│       ├── ml/                 # PFZ predictor, risk scorer, anomaly detection
│       ├── rag/                # BGE-M3 embedder + pgvector retrieval
│       ├── schemas/            # Pydantic v2 models
│       └── services/           # Alert, notification, scheduler services
├── frontend/                   # React + TypeScript + Tailwind
│   └── src/
│       ├── apps/               # 10 role-specific dashboard apps
│       ├── components/         # Shared UI components (chat, map, cards, alerts)
│       ├── types/              # TypeScript types
│       └── store/              # Zustand state
├── mobile/                     # React Native (Expo)
├── infra/                      # Docker, Prometheus, Grafana, PostgreSQL init
└── data/sample/                # Representative labelled datasets
```

---

## Safety & Reliability

- ❌ **Never** claims "guaranteed safe", "guaranteed catch" or "perfect prediction"
- ✅ Official warnings are always **authoritative** — surfaced prominently
- ✅ Restricted zone checks are **deterministic** — no LLM override
- ✅ Every factual claim has **source + timestamp** in evidence panel
- ✅ Stale data is **explicitly disclosed** — never labelled as current
- ✅ **Audit logs** for all safety-critical recommendation paths

---

## Data Sources

| Category | Sources |
|---|---|
| Satellite EO | MOSDAC/ISRO, Copernicus, NASA, NOAA |
| Ocean | INCOIS OSF, buoys, Argo floats |
| Weather | IMD, ECMWF, GFS |
| Tides | INCOIS tidal predictions |
| GIS | Bhuvan, GEBCO, Admiralty Charts |
| Advisories | INCOIS, IMD, RSMC, NOTAM |

> **Note:** Representative sample data is used for development. Live API integration is in progress.

---

## License

MIT — © 2026 Team TechnoCrakerz
