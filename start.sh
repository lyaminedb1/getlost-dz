#!/bin/bash
TEAL='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "\n${TEAL}╔══════════════════════════════════════════╗${NC}"
echo -e "${TEAL}║     GET LOST DZ  —  Full Stack  🏔️        ║${NC}"
echo -e "${TEAL}╚══════════════════════════════════════════╝${NC}\n"

# Check Python
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌  Python 3 required${NC}"; exit 1; }

# Install dependencies if missing
python3 -c "import flask,flask_cors,jwt,bcrypt" 2>/dev/null || {
    echo "📦 Installing dependencies..."
    pip install flask flask-cors pyjwt bcrypt --break-system-packages -q 2>/dev/null || \
    pip install flask flask-cors pyjwt bcrypt -q
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT=5000

# Free the port (handles AirPlay Receiver and lingering processes)
FREE_PID=$(lsof -ti tcp:$PORT 2>/dev/null)
if [ -n "$FREE_PID" ]; then
    echo -e "⚠️  Port $PORT in use (PID $FREE_PID) — freeing it..."
    kill -9 $FREE_PID 2>/dev/null
    sleep 1
fi

# If still busy, try port 5001
if lsof -ti tcp:$PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5000 still busy (AirPlay?). Using port 5001 instead.${NC}"
    PORT=5001
    export FLASK_PORT=5001
fi

echo -e "${GREEN}✅  Starting on http://localhost:${PORT}${NC}\n"
echo -e "${YELLOW}  👤 Admin:    admin@getlostdz.com  /  admin123${NC}"
echo -e "${YELLOW}  🏢 Agency:   agency1@getlostdz.com  /  agency123${NC}"
echo -e "${YELLOW}  🧳 Traveler: sarah@test.com  /  user123${NC}\n"
echo -e "  📌 Open ${TEAL}http://localhost:${PORT}${NC} in your browser"
echo -e "  Press ${TEAL}Ctrl+C${NC} to stop\n"

PORT=$PORT python3 server.py
