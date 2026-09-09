#!/usr/bin/env bash
# ==============================================================================
# LOGINTEL — 1-Click Automated Production Deployment Script
# ==============================================================================
# Target: Ubuntu 22.04 / Debian 12 / RHEL Linux VPS (e.g. AWS EC2, DigitalOcean)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  LOGINTEL — PRODUCTION CLOUD & VPS DEPLOYMENT AUTOMATOR        ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Check prerequisites
echo -e "\n${YELLOW}[STEP 1/6] Checking system prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed on this host.${NC}"
    echo "Installing Docker Engine via official get.docker.com script..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    systemctl enable --now docker
    echo -e "${GREEN}[OK] Docker Engine installed successfully.${NC}"
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose v2 is required.${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 2. Check environment configuration
echo -e "\n${YELLOW}[STEP 2/6] Verifying production environment (.env)...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[!] No .env file found. Creating from .env.production.example...${NC}"
    cp .env.production.example .env
    
    # Auto-generate secure random secrets
    GEN_SECRET=$(openssl rand -hex 32)
    GEN_DB_PASS=$(openssl rand -hex 16)
    
    sed -i "s/GENERATE_SECURE_RANDOM_SECRET_KEY_HERE_MIN_64_CHARS/${GEN_SECRET}/g" .env
    sed -i "s/GENERATE_SECURE_DB_PASSWORD_HERE/${GEN_DB_PASS}/g" .env
    chmod 600 .env
    echo -e "${GREEN}[OK] Generated secure .env with cryptographically strong keys.${NC}"
else
    echo -e "${GREEN}[OK] Existing .env file found and preserved.${NC}"
fi

# 3. Kernel & Virtual Memory tuning for OpenSearch
echo -e "\n${YELLOW}[STEP 3/6] Tuning Linux kernel virtual memory for OpenSearch...${NC}"
CURRENT_MAP_COUNT=$(sysctl -n vm.max_map_count || echo 0)
if [ "${CURRENT_MAP_COUNT}" -lt 262144 ]; then
    echo "Increasing vm.max_map_count to 262144..."
    sysctl -w vm.max_map_count=262144
    echo "vm.max_map_count=262144" >> /etc/sysctl.d/99-opensearch.conf || true
fi

# 4. Pull and Build Images
echo -e "\n${YELLOW}[STEP 4/6] Building production container images...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# 5. Launch Stack
echo -e "\n${YELLOW}[STEP 5/6] Starting LogIntel production services...${NC}"
docker compose -f docker-compose.prod.yml up -d

# 6. Verify Health
echo -e "\n${YELLOW}[STEP 6/6] Polling container health status...${NC}"
sleep 15
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  LOGINTEL PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!        ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "Frontend Portal:  http://$(hostname -I | awk '{print $1}') (Port 80)"
echo -e "Backend API /docs: http://$(hostname -I | awk '{print $1}')/docs"
echo -e "Syslog Port:      UDP 5140"
echo -e "Database/Search:  Isolated in private Docker bridge network (Non-public)"
echo -e "================================================================\n"
