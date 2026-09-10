#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# ORCA — Local Development Startup Script (No Docker)
# ──────────────────────────────────────────────────────────────────────────────
# Usage:  ./start-local.sh [all|backend|frontend|services|stop]
# ──────────────────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()   { echo -e "${GREEN}[ORCA]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Start Infrastructure Services ─────────────────────────────────────────────
start_services() {
    log "Starting infrastructure services..."

    # PostgreSQL
    if pg_isready -q 2>/dev/null; then
        log "PostgreSQL already running ✓"
    else
        log "Starting PostgreSQL..."
        brew services start postgresql@18 2>/dev/null || {
            # Try EDB PostgreSQL
            pg_ctl -D /Library/PostgreSQL/18/data start 2>/dev/null || warn "Could not start PostgreSQL"
        }
        sleep 2
    fi

    # Redis
    if redis-cli ping &>/dev/null; then
        log "Redis already running ✓"
    else
        log "Starting Redis..."
        redis-server --daemonize yes 2>/dev/null || brew services start redis 2>/dev/null || warn "Could not start Redis"
        sleep 1
    fi

    # Ollama
    if curl -s http://localhost:11434/api/tags &>/dev/null; then
        log "Ollama already running ✓"
    else
        log "Starting Ollama..."
        ollama serve &>/dev/null &
        sleep 2
    fi

    # Verify
    echo ""
    log "Service Status:"
    pg_isready -q 2>/dev/null   && log "  PostgreSQL : ${GREEN}UP${NC}" || warn "  PostgreSQL : DOWN"
    redis-cli ping &>/dev/null  && log "  Redis      : ${GREEN}UP${NC}" || warn "  Redis      : DOWN"
    curl -s http://localhost:11434/api/tags &>/dev/null && log "  Ollama     : ${GREEN}UP${NC}" || warn "  Ollama     : DOWN"
    echo ""
}

# ── Start Backend ─────────────────────────────────────────────────────────────
start_backend() {
    log "Starting FastAPI backend on http://localhost:8000 ..."
    cd "$PROJECT_DIR/backend"
    .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    log "Backend PID: $BACKEND_PID"
    echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"
}

# ── Start Frontend ────────────────────────────────────────────────────────────
start_frontend() {
    log "Starting Vite frontend on http://localhost:3000 ..."
    cd "$PROJECT_DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!
    log "Frontend PID: $FRONTEND_PID"
    echo $FRONTEND_PID > "$PROJECT_DIR/.frontend.pid"
}

# ── Stop Everything ──────────────────────────────────────────────────────────
stop_all() {
    log "Stopping ORCA services..."
    [ -f "$PROJECT_DIR/.backend.pid" ]  && kill $(cat "$PROJECT_DIR/.backend.pid") 2>/dev/null  && rm "$PROJECT_DIR/.backend.pid"  && log "Backend stopped"
    [ -f "$PROJECT_DIR/.frontend.pid" ] && kill $(cat "$PROJECT_DIR/.frontend.pid") 2>/dev/null && rm "$PROJECT_DIR/.frontend.pid" && log "Frontend stopped"
    pkill -f "ollama serve" 2>/dev/null && log "Ollama stopped" || true
    redis-cli shutdown 2>/dev/null && log "Redis stopped" || true
    log "Done."
}

# ── Main ─────────────────────────────────────────────────────────────────────
case "${1:-all}" in
    services)
        start_services
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    stop)
        stop_all
        ;;
    all)
        start_services
        start_backend
        start_frontend
        log ""
        log "═══════════════════════════════════════════════════"
        log "  ORCA is running locally! 🐋"
        log "  Frontend : ${CYAN}http://localhost:3000${NC}"
        log "  Backend  : ${CYAN}http://localhost:8000${NC}"
        log "  API Docs : ${CYAN}http://localhost:8000/docs${NC}"
        log "  Ollama   : ${CYAN}http://localhost:11434${NC}"
        log "═══════════════════════════════════════════════════"
        log ""
        log "Press Ctrl+C to stop all services"
        wait
        ;;
    *)
        echo "Usage: $0 [all|backend|frontend|services|stop]"
        exit 1
        ;;
esac
