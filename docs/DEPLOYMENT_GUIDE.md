# 🚀 LogIntel — Production Deployment & Operations Guide

## 1. Production Architecture Overview

LogIntel uses an enterprise-grade, containerized microservices architecture optimized for security, observability, and sub-second threat detection:

```text
                                INTERNET
                                   │
                                   ▼
                           [Port 80 / 443]
                     Nginx Reverse Proxy & TLS (Frontend)
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
           / (SPA Assets)                         /api/ & /docs
                │                                     │
                ▼                                     ▼
        React 18 Dashboard                  FastAPI Backend Gateway
        (HTML/JS/CSS Static)               (Threat Detection & Auth)
                                                      │
                         ┌────────────────────────────┼────────────────────────────┐
                         │                            │                            │
                         ▼                            ▼                            ▼
                 PostgreSQL 15                OpenSearch 2.12.0               Fluent-Bit 3.0
            (Metadata, RBAC, Audits)        (Distributed Log Store)       (Syslog UDP :5140)
                                                      ▲                            ▲
                                                      └─────────────┬──────────────┘
                                                                    │
                                                             Log Sources /
                                                        Admin Simulator Center
```

### Security Isolation
- **Public Entrypoints:** Port 80 (HTTP) and Port 443 (HTTPS) routed through Nginx. Port 5140 (UDP) for network syslog ingestion.
- **Internal Only:** PostgreSQL (5432) and OpenSearch (9200, 9600) have **NO public port exposure**. They communicate exclusively within the private Docker bridge network `logintel-prod-network`.

---

## 2. Server Prerequisites

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 / RHEL 9 | Ubuntu 22.04 LTS |
| **CPU** | 2 vCPUs | 4 vCPUs |
| **RAM** | 4 GB | 8 GB |
| **Disk Space** | 20 GB SSD | 40+ GB SSD |
| **Software** | Docker Engine 24+ & Docker Compose v2 | Docker Engine 25+ |

---

## 3. Environment Variables (.env)

Before launching, create `.env` on the host using `.env.production.example`:

```bash
cp .env.production.example .env
chmod 600 .env
```

Key environment configurations:
- `SECRET_KEY`: Cryptographically random 64-character secret (`openssl rand -hex 32`).
- `POSTGRES_USER`: Database administrator username.
- `POSTGRES_PASSWORD`: Strong unique database password.
- `POSTGRES_DB`: Production database name (`logintel_prod`).
- `OPENSEARCH_HOST`: `opensearch` (internal container DNS).
- `OPENSEARCH_PORT`: `9200`.
- `PRODUCTION_CORS_ORIGINS`: Comma-separated list of allowed origins (e.g. `https://logintel.yourdomain.com`).

---

## 4. 1-Click Deployment Procedure

### Step 1: Clone Repository
```bash
git clone https://github.com/Vishv05/LogIntel.git
cd LogIntel
```

### Step 2: Configure Environment
```bash
cp .env.production.example .env
# Edit .env with your production secrets
nano .env
```

### Step 3: Run Deployment Script
```bash
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh
```

Or manually with Docker Compose:
```bash
# Tune Linux virtual memory for OpenSearch
sudo sysctl -w vm.max_map_count=262144

# Build and start services
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. Domain & Free HTTPS Setup (Let's Encrypt)

To secure the deployment with free SSL/TLS certificates using Certbot:

```bash
# 1. Install Certbot
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx

# 2. Stop frontend temporarily to bind port 80 for challenge
docker compose -f docker-compose.prod.yml stop frontend

# 3. Obtain Certificate
sudo certbot certonly --standalone -d logintel.yourdomain.com

# 4. Mount certificates into frontend/nginx and restart
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## 6. Operations & Maintenance

### Check Service Health & Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### View Live Logs
```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View backend logs only
docker compose -f docker-compose.prod.yml logs -f backend

# View OpenSearch logs only
docker compose -f docker-compose.prod.yml logs -f opensearch
```

### Restart Services
```bash
# Restart entire stack
docker compose -f docker-compose.prod.yml restart

# Restart a single service
docker compose -f docker-compose.prod.yml restart backend
```

### Rollback Procedure
```bash
# 1. Stop the current stack without deleting volumes
docker compose -f docker-compose.prod.yml down

# 2. Checkout the previous known-good git commit
git checkout <PREVIOUS_COMMIT_HASH>

# 3. Rebuild and launch
docker compose -f docker-compose.prod.yml up --build -d
```

### Trigger On-Demand Test Scenarios
```bash
# Trigger automated synthetic security events via Docker Compose profile
docker compose -f docker-compose.prod.yml run --rm log-simulator python simulator.py --mode scenario --scenario all
```
