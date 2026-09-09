#!/usr/bin/env bash
set -e

# ===================================================
# ScholarStream / BookNest Project Launcher
# ===================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "${SCRIPT_DIR}/13389_8995_1_14276/backend" ]; then
    PROJECT_ROOT="${SCRIPT_DIR}/13389_8995_1_14276"
elif [ -d "${SCRIPT_DIR}/backend" ] && [ -d "${SCRIPT_DIR}/frontend" ]; then
    PROJECT_ROOT="${SCRIPT_DIR}"
elif [ -d "/home/beast/Documents/learn/AD/13389_8995_1_14276" ]; then
    PROJECT_ROOT="/home/beast/Documents/learn/AD/13389_8995_1_14276"
else
    echo "[-] Error: Project directory not found!"
    exit 1
fi

BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

echo "==================================================="
echo "    Starting ScholarStream / BookNest Project"
echo "==================================================="
echo "[*] Project Root: ${PROJECT_ROOT}"
echo "[*] Backend Dir : ${BACKEND_DIR}"
echo "[*] Frontend Dir: ${FRONTEND_DIR}"
echo "---------------------------------------------------"

# 1. Start MariaDB if inactive
if ! systemctl is-active --quiet mariadb; then
    echo "[1/3] Starting MariaDB service..."
    sudo systemctl start mariadb || true
else
    echo "[1/3] MariaDB is active."
fi

# Function to launch a command in a new terminal window/tab
launch_in_terminal() {
    local title="$1"
    local dir="$2"
    local cmd="$3"

    if [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; then
        if command -v xfce4-terminal &>/dev/null; then
            xfce4-terminal --hold --title="${title}" --working-directory="${dir}" -x bash -c "${cmd}; exec bash" &
            return 0
        elif command -v qterminal &>/dev/null; then
            qterminal -e "bash -c 'cd \"${dir}\" && ${cmd}; exec bash'" &
            return 0
        elif command -v kitty &>/dev/null; then
            kitty --title "${title}" --directory "${dir}" bash -c "${cmd}; exec bash" &
            return 0
        elif command -v x-terminal-emulator &>/dev/null; then
            x-terminal-emulator -e "bash -c 'cd \"${dir}\" && ${cmd}; exec bash'" &
            return 0
        elif command -v xterm &>/dev/null; then
            xterm -hold -title "${title}" -e "bash -c 'cd \"${dir}\" && ${cmd}; exec bash'" &
            return 0
        fi
    fi

    # Fallback if no GUI display is attached
    local log_file="/tmp/${title// /_}.log"
    echo "[!] No terminal emulator found. Spawning background daemon (Logs: ${log_file})..."
    (cd "${dir}" && eval "${cmd}" > "${log_file}" 2>&1) &
}

# 2. Launch Backend in terminal
echo "[2/3] Launching Spring Boot Backend (Port 8080)..."
launch_in_terminal "ScholarStream Backend" "${BACKEND_DIR}" "mvn spring-boot:run || ./mvnw spring-boot:run"

# Allow backend initialization
sleep 3

# 3. Launch Frontend in terminal
echo "[3/3] Launching React Frontend (Port 3001/3000)..."
launch_in_terminal "ScholarStream Frontend" "${FRONTEND_DIR}" "npm start"

echo "==================================================="
echo " Services initiated:"
echo " - Backend API : http://localhost:8080"
echo " - Frontend UI : http://localhost:3001 (or :3000)"
echo "==================================================="
