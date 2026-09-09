# 🛡️ LogIntel — Centralized Log Intelligence & Threat Monitoring Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![OpenSearch](https://img.shields.io/badge/OpenSearch-2.12-005FCC?style=flat&logo=opensearch&logoColor=white)](https://opensearch.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE-ATT%26CK%20v14-FF6F00?style=flat)](https://attack.mitre.org)

> **Nexus Hackathon Project**  
> **Authors & Engineering Team**:  
> - **Bhavsar Vishv Jigneshkumar** (ID: `202201619010239`)  
> - **Sojitra Dhruvil Vipulbhai** (ID: `202201619010336`)  
> 
> **Repository**: [https://github.com/Vishv05/LogIntel](https://github.com/Vishv05/LogIntel)

---

## 🌟 Executive Summary

**LogIntel** is an enterprise-grade, high-throughput log intelligence, security information, and event monitoring (**SIEM**) platform. It is engineered to ingest, normalize, index, and correlate heterogeneous machine logs across distributed hybrid environments—from physical security cameras and core switches to cloud workloads and microservices.

Traditional SIEM tools drown security analysts in disconnected alerts. **LogIntel solves alert fatigue** through:
1. **Deterministic Multi-Event Correlation**: Aggregates isolated anomalies into coherent, attack-scoped **Incidents**.
2. **Dynamic Risk Scoring (0–100)**: Multi-factor composite risk engine weighing base severity, asset criticality, recurrence velocity, and blast radius.
3. **Chronological Attack Timelines**: Interactive visual reconstruction of multi-stage kill chains mapped directly to **MITRE ATT&CK** techniques.
4. **AI Incident Explainer & Copilot**: Automated root-cause analysis, plain-language executive summaries, and actionable remediation runbooks.
5. **Dual-Portal Role-Based Architecture**: Specialized operational surfaces for **SOC Security Analysts** (triage, threat intelligence, kill-chain investigation) and **System Administrators** (cluster topology, node health, ingestion rate throttling, retention policies, and immutable audit trails).

---

## 🏛️ System Architecture

```text
                                     HETEROGENEOUS LOG SOURCES
      ┌─────────────────┬──────────────────┬─────────────────┬─────────────────┬─────────────────┐
      │  AWS CloudWatch │    Perimeter     │   Core L2/L3    │ Physical CCTV   │ Linux / Windows │
      │  & IAM / VPC    │    Firewalls     │Network Switches │ Security Cameras│ Active Directory│
      └────────┬────────┴────────┬─────────┴────────┬────────┴────────┬────────┴────────┬────────┘
               │                 │                  │                 │                 │
               └─────────────────┴─────────┬────────┴─────────────────┴─────────────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │ Fluent-Bit Ingestion│ (Syslog UDP :5140 / HTTP :8888)
                                └──────────┬──────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │   FastAPI Ingestion Gateway │ (/api/logs/ingest)
                            │   • Timestamp Normalization │
                            │   • Severity Stratification │
                            │   • IP & Asset Extraction   │
                            └──────────────┬──────────────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
      ┌─────────────────────────────┐             ┌─────────────────────────────┐
      │ Deterministic Threat Engine │             │  Dual-Mode Storage Adapter  │
      │  • Multi-Event Correlation  │             │  • Primary: OpenSearch 2.12 │
      │  • Dynamic Risk Scoring     │             │  • Fallback: SQLite Full-Txt│
      │  • MITRE ATT&CK Mapping     │             │  • Metadata: PostgreSQL 15  │
      └──────────────┬──────────────┘             └──────────────┬──────────────┘
                     │                                           │
                     └─────────────────────┬─────────────────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │ FastAPI REST Server │ (Port :8000 / /api/v1)
                                └──────────┬──────────┘
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
       ┌───────────────────────────────┐         ┌───────────────────────────────┐
       │   SOC Analyst User Portal     │         │   System Administrator Portal │
       │   Port 3000 / (Path: /)       │         │   Port 3001 / (Path: /admin)  │
       │  • Active Incidents & Triage  │         │  • Dynamic Topology Map       │
       │  • Attack Timelines & MITRE   │         │  • Real-Time Component Health │
       │  • Deep Log Explorer (Search) │         │  • Alert Policy Engine        │
       │  • AI Explainer & Copilot     │         │  • Rate Limiting & Retention  │
       │  • Threat Intel Feeds         │         │  • Immutable Audit Trail      │
       └───────────────────────────────┘         └───────────────────────────────┘
```

---

## 🚀 Key Platform Capabilities

### 1. Multi-Source Heterogeneous Ingestion
- Ingests structured JSON, raw Syslog (**RFC 5424 / RFC 3164** via UDP `:5140`), and REST HTTP payloads.
- Automated payload normalization extracts timestamps, canonical severity levels (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`), hostnames, source categories, IP addresses, and custom metadata.
- Pre-integrated connectors for:
  - **AWS CloudWatch / IAM / VPC Flow Logs**: Root credential usage, unauthorized IAM policy modifications, security group changes.
  - **Perimeter Firewalls**: High-volume connection drops, egress anomalies, SYN/UDP floods.
  - **L2/L3 Network Switches**: Spanning-tree topology transitions, port link-down flaps, MAC address spoofing.
  - **Physical CCTV Cameras**: Optical lens obstruction, physical enclosure tampering, tamper sabotage alarms.
  - **Linux / Windows Servers**: SSH authentication failures, sudo privilege escalation, Windows Event 4625/4624.

### 2. Deterministic Threat Detection & Correlation Engine
Real-time correlation rules evaluate incoming event windows without human intervention:
- **`RULE-AUTH-001` — Brute Force Authentication Attack**: Detects $\ge 5$ failed login attempts targeting the same username or originating from the same IP within a 5-minute sliding window. (*MITRE ATT&CK: T1110*).
- **`RULE-NET-002` — Vertical/Horizontal Reconnaissance Scan**: Identifies rapid connection attempts across $\ge 5$ distinct destination ports from a single origin. (*MITRE ATT&CK: T1046*).
- **`RULE-NET-003` — Perimeter Firewall Dropped Connection Flood**: Detects sustained connection drop surges exceeding 10 drops per second. (*MITRE ATT&CK: T1498*).
- **`RULE-DEV-004` — Critical Infrastructure Disconnect Anomaly**: Triggers when core switches, power distribution units (PDUs), or edge routers report sudden state drops. (*MITRE ATT&CK: T1082*).
- **`RULE-CCTV-005` — Physical Security Sabotage & Optical Occlusion**: Detects physical video signal loss, lens obscuration, or tamper switch actuation. (*MITRE ATT&CK: T1078 / Physical*).
- **`RULE-AWS-006` — Privileged AWS Root Account Misuse**: Alerts immediately upon console login by the AWS Root account or sensitive IAM policy alterations. (*MITRE ATT&CK: T1078.004*).

### 3. Dynamic Risk Scoring Engine (0–100)
Every alert and incident is scored dynamically using a transparent composite algorithm:
$$\text{Risk Score} = \min\left(100, \; \text{Base Severity} + \text{Asset Multiplier} + \text{Velocity Factor} + \text{Blast Radius}\right)$$
- **Base Severity Weight**: Critical = 40, High = 30, Medium = 15, Low = 5.
- **Asset Criticality**: Sensitive production hosts, domain controllers, and cloud roots add $+20$ to $+30$.
- **Velocity / Frequency**: Recurrent triggers within short intervals increase the score progressively.
- **Visual Risk Stratification**:
  - 🟢 **Low Risk (0–39)**: Informational or low-priority events.
  - 🟡 **Medium Risk (40–69)**: Suspicious events requiring queue triage.
  - 🟠 **High Risk (70–84)**: Confirmed malicious activity requiring immediate containment.
  - 🔴 **Critical Risk (85–100)**: Active intrusion requiring emergency isolation.

### 4. Incident Correlation & Chronological Attack Timelines
- **Alert-to-Incident Synthesis**: Related alerts sharing common attack vectors (e.g., source IP, target asset, credential) are automatically correlated into a single parent **Incident**.
- **Interactive Chronological Timeline**: Visually inspects the adversary's path step-by-step from initial reconnaissance, to brute-force credential stuffing, to unauthorized access, and exfiltration attempts.
- **MITRE ATT&CK Matrix Alignment**: Visual badges identify exact tactic and technique IDs (e.g., `T1110 - Brute Force`, `T1046 - Network Service Discovery`, `T1078.004 - Cloud Administration Accounts`).

### 5. AI Incident Explainer & SOC Copilot
- **Plain-Language Executive Summary**: Translates dense log telemetry into clear, human-readable prose explaining what happened.
- **Root-Cause Analysis**: Highlights the specific failure or vulnerability exploited.
- **Tactical Remediation Runbook**: Step-by-step containment instructions (e.g., *Firewall IP block rule*, *IAM key revocation*, *Switch port quarantine*).
- **Extensible Architecture**: Operates with a deterministic heuristic explanation generator out of the box, with native drop-in support for OpenAI/Gemini/Local LLM APIs.

### 6. Dual-Portal Architecture & Role-Based Access Control (RBAC)
- **SOC Analyst User Portal** (`http://localhost:3000` / `/`):
  - **Incident Center**: Real-time incident list with risk badges, status filters (`OPEN`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`), and assignee tracking.
  - **Incident Detail View**: Complete chronological event timeline, MITRE technique tags, and integrated AI Explainer.
  - **Deep Log Explorer**: Sub-second full-text and regex search, field-level filtering, ISO date range selection, and raw JSON modal inspection.
  - **Threat Intelligence**: IP reputation lookup, active IOC feed, and geo-origin intelligence.
  - **Alert Triage Lifecycle**: Assign, comment, transition state, and document root-cause resolutions.
- **System Administrator Portal** (`http://localhost:3001` / `/admin`):
  - **Interactive Network Topology Map**: Dynamic visual topology diagram showing data flow across all active nodes (Sources ➔ Fluent-Bit ➔ FastAPI ➔ PostgreSQL/OpenSearch).
  - **System Health Center**: Real-time heartbeat, latency metrics, and operational status for all microservices (FastAPI, PostgreSQL, OpenSearch Cluster, Fluent-Bit).
  - **Automated Alert Policies**: Configure escalation rules, notification channels (Slack, Webhooks, Email), and SLA deadlines.
  - **Ingestion Throttling & Rate Limits**: Live throttle slider to manage spikes and safeguard system stability.
  - **Storage & Retention Governance**: Storage usage visualization, compression metrics, auto-purge thresholds, and retention policies by log classification.
  - **User & RBAC Management**: Create and manage analysts, administrators, and guest accounts.
  - **Immutable Audit Trail**: Append-only tamper-evident audit log tracking every login, configuration change, and triage action.
  - **Threat Simulator Control**: One-click attack injection center to simulate live attack waves during evaluations or drills.

---

## 🔑 Default Credentials & Evaluation Accounts

| Username | Password | Assigned Role | Primary Dashboard & Capabilities |
| :--- | :--- | :--- | :--- |
| `admin` | `adminpassword123` | **Admin** | Full access to Admin Portal (`:3001`), System Health, Policies, Topology, User Management |
| `analyst` | `analystpassword123` | **Security Analyst** | SOC User Portal (`:3000`), Incident Triage, Log Explorer, AI Explainer, Threat Intel |
| `vishv` | `vishvpassword123` | **Admin** | Bhavsar Vishv Jigneshkumar (`202201619010239`) — Full System Administration |
| `dhruvil` | `dhruvilpassword123` | **Admin** | Sojitra Dhruvil Vipulbhai (`202201619010336`) — Full System Administration |

---

## 💻 Quickstart & Running Locally

LogIntel is engineered with an **intelligent dual-mode storage engine**:
- In **Enterprise Mode**, it connects to OpenSearch and PostgreSQL for distributed clustering.
- In **Standalone Mode**, it automatically falls back to an embedded SQLite database with pre-seeded data, requiring **zero external database dependencies**.

### Option 1: 1-Click Launch with Docker Compose (Recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/):

```bash
# Clone the repository
git clone https://github.com/Vishv05/LogIntel.git
cd LogIntel

# Launch all microservices in the background
docker compose up --build -d
```

#### Services Started:
| Service | URL / Port | Purpose |
| :--- | :--- | :--- |
| **SOC Analyst Portal** | [http://localhost:3000](http://localhost:3000) | Security Analyst incident investigation & log search |
| **System Admin Portal** | [http://localhost:3001](http://localhost:3001) | Administrator topology, policies, health & user controls |
| **FastAPI Backend & Swagger** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI 3.0 specification & REST APIs |
| **OpenSearch Cluster** | [http://localhost:9200](http://localhost:9200) | Distributed document indexing & search store |
| **Fluent-Bit Gateway** | `localhost:8888` / `5140` (UDP) | Multi-source log ingestion & syslog listener |
| **PostgreSQL 15** | `localhost:5432` | Relational store for users, alerts, incidents, and audit logs |
| **Log Simulator** | Background Container | Real-time continuous log generation and attack injector |

---

### Option 2: Local Standalone Development (Zero-Dependency SQLite Mode)

You can run the entire LogIntel stack locally without Docker or external databases:

#### 1. Backend Setup
```bash
# Navigate to project root
cd "LogIntel (Nexus Hackathon)"

# Activate virtual environment
.\backend\.venv\Scripts\Activate.ps1   # Windows PowerShell
# or: source backend/.venv/bin/activate # Linux / macOS

# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI backend
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
*Backend runs on `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

#### 2. Frontend Portals Setup
```bash
# In a separate terminal, navigate to the frontend directory
cd frontend
npm install

# Start SOC Analyst User Portal (Port 3000)
npm run dev:user

# In another terminal, start System Admin Portal (Port 3001)
npm run dev:admin
```
- Access SOC Analyst Portal: [http://localhost:3000](http://localhost:3000)
- Access Admin Portal: [http://localhost:3001](http://localhost:3001)

*(Alternatively, run `.\start-app.bat` on Windows to launch backend and both portals in a single click).*

---

## 🌐 Production Cloud / VPS Deployment

LogIntel includes a production-hardened deployment configuration featuring an **Nginx reverse proxy**, automatic TLS termination, rate-limiting, and internal security isolation:

```bash
# 1. On your production server (Ubuntu 22.04 LTS / Debian 12)
git clone https://github.com/Vishv05/LogIntel.git
cd LogIntel

# 2. Configure production secrets
cp .env.production.example .env
chmod 600 .env
# Edit .env and replace placeholder secrets with secure keys:
# openssl rand -hex 32

# 3. Launch via automated deployment script
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Or deploy manually via Docker Compose Production:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

For complete step-by-step production instructions (including Let's Encrypt SSL/TLS, UFW firewall configuration, and automated backups), see [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

---

## 🧪 Threat Simulation & Attack Scenarios

LogIntel includes a built-in attack scenario generator (`log-simulator/simulator.py`) capable of streaming realistic background telemetry or injecting multi-stage cyber attacks:

```bash
# Inject all simulated attack scenarios (Brute-Force, Port Scan, CCTV Tampering, AWS Anomaly):
python log-simulator/simulator.py --mode scenario --scenario all

# Inject individual targeted attack vectors:
python log-simulator/simulator.py --mode scenario --scenario bruteforce
python log-simulator/simulator.py --mode scenario --scenario portscan
python log-simulator/simulator.py --mode scenario --scenario cctv
python log-simulator/simulator.py --mode scenario --scenario aws

# Stream continuous realistic enterprise logs every 2 seconds:
python log-simulator/simulator.py --mode stream --interval 2.0

# Batch ingest 50 logs from firewall only:
python log-simulator/simulator.py --mode batch --count 50 --source firewall
```

You can also trigger these scenarios with one click from the **Admin Portal** under **Threat Simulation Control Center** (`http://localhost:3001/admin`).

---

## 🔬 Automated Testing & Verification

LogIntel adheres to rigorous software engineering standards with full automated testing:

```bash
# 1. Run Backend Pytest Suite (Auth, Incidents, Threat Intel, Admin, Correlation, Rules)
.\backend\.venv\Scripts\python.exe -m pytest backend/tests -v

# 2. Run Comprehensive Phase 5 End-to-End Test Suite (52/52 passing assertions)
python scratch/test_e2e_phase5.py

# 3. Verify Frontend Production Build
cd frontend
npm run build
```

---

## 📁 Repository Structure

```text
LogIntel (Nexus Hackathon)/
├── .dockerignore                       # Root Docker ignore rules
├── .env.example                        # Development environment template
├── .env.production.example             # Hardened production environment template
├── .gitignore                          # Git hygiene exclusions
├── docker-compose.yml                  # Local development multi-container orchestration
├── docker-compose.prod.yml             # Production hardened multi-container orchestration
├── README.md                           # Master project documentation
├── start-app.bat                       # 1-Click local Windows startup script
├── push_to_github.bat                  # Automated git push utility
│
├── backend/                            # FastAPI Backend Microservice
│   ├── Dockerfile                      # Backend container definition
│   ├── requirements.txt                # Python dependencies
│   ├── app/
│   │   ├── main.py                     # FastAPI entrypoint, middleware, CORS, routers
│   │   ├── api/                        # REST API Router Endpoints
│   │   │   ├── admin.py                # System topology, policies, health, storage quotas
│   │   │   ├── auth.py                 # JWT login, refresh tokens, user profile
│   │   │   ├── incidents.py            # Incidents, attack timelines, AI explainer
│   │   │   ├── logs.py                 # High-throughput ingestion & search endpoints
│   │   │   ├── threat_intel.py         # IOC feeds, IP reputation lookups
│   │   │   └── users.py                # RBAC user management endpoints
│   │   ├── core/                       # Security, config, database & OpenSearch engines
│   │   │   ├── config.py               # Pydantic v2 application settings
│   │   │   ├── database.py             # SQLAlchemy session management
│   │   │   ├── opensearch.py           # Dual-mode search engine (OpenSearch + SQLite fallback)
│   │   │   └── security.py             # Passlib bcrypt hashing & PyJWT tokens
│   │   ├── models/                     # SQLAlchemy ORM Data Models
│   │   │   ├── alert.py                # Alert schema & status enum
│   │   │   ├── incident.py             # Incident & attack timeline models
│   │   │   ├── log.py                  # Log records & normalized fields
│   │   │   ├── rule.py                 # Threat detection rule definitions
│   │   │   └── user.py                 # User accounts & RBAC roles
│   │   ├── schemas/                    # Pydantic validation contracts
│   │   ├── services/                   # Business Logic & Analytical Engines
│   │   │   ├── admin_config_service.py # Admin state, alert policies, rate limits
│   │   │   ├── ai_explainer_service.py # Automated AI incident synthesis & runbooks
│   │   │   ├── alert_service.py        # Alert creation, dispatch & lifecycle
│   │   │   ├── correlation_service.py  # Multi-event correlation into Incidents
│   │   │   ├── log_service.py          # Dual-mode ingestion, indexing & filtering
│   │   │   ├── risk_service.py         # Dynamic multi-factor risk scoring (0-100)
│   │   │   └── threat_intel_service.py # Threat intelligence indicators & reputation
│   │   └── utils/                      # Utilities, Syslog UDP listener & seed generator
│   │       ├── seed_data.py            # Initial system state & evaluation demo seed
│   │       └── syslog_server.py        # Async UDP RFC 5424/3164 Syslog listener
│   └── tests/                          # Pytest Automated Test Suite
│       ├── conftest.py                 # Test fixtures & temporary test databases
│       ├── test_admin.py               # Admin API & system health unit tests
│       ├── test_auth.py                # Authentication & RBAC role verification tests
│       └── test_incidents_threat_intel.py # Incidents, timelines & threat intel tests
│
├── frontend/                           # React 18 + Vite + Tailwind CSS Portals
│   ├── Dockerfile                      # Multi-stage Nginx production container
│   ├── package.json                    # Node dependencies & dual-portal scripts
│   ├── vite.config.js                  # Vite bundler & reverse proxy configuration
│   └── src/
│       ├── App.jsx                     # Route definitions & portal switching
│       ├── components/                 # Reusable UI & Security Components
│       │   ├── AIExplainerModal.jsx    # AI incident explanation & runbook modal
│       │   ├── ExplainableDetectionCard.jsx # MITRE ATT&CK & detection rule breakdown
│       │   ├── IncidentTimeline.jsx    # Interactive chronological attack timeline
│       │   ├── RecommendedResponseCard.jsx # Actionable mitigation runbook card
│       │   ├── RiskScoreBadge.jsx      # Color-coded 0-100 dynamic risk score badge
│       │   ├── Header.jsx              # Universal navigation header & user profile
│       │   ├── Sidebar.jsx             # Role-aware sidebar navigation
│       │   └── StatCard.jsx            # KPI metric cards with trends
│       ├── context/                    # React Context (AuthContext & state)
│       ├── pages/                      # Application Page Views
│       │   ├── UserDashboard.jsx       # SOC Analyst command center
│       │   ├── IncidentsPage.jsx       # Correlated incidents triage table
│       │   ├── IncidentDetailPage.jsx  # Deep incident investigation & attack timeline
│       │   ├── LogExplorerPage.jsx     # Full-text log query & JSON inspector
│       │   ├── ThreatIntelPage.jsx     # IOC feed & IP reputation search
│       │   ├── AdminDashboard.jsx      # Admin topology map, health & policies
│       │   ├── UsersPage.jsx           # User management & RBAC administration
│       │   └── AnalyticsPage.jsx       # Volume trends & severity distribution charts
│       └── services/                   # Axios API Connectors
│
├── deploy/                             # Production Deployment Assets
│   ├── deploy.sh                       # Automated VPS deployment script
│   └── nginx.conf                      # Production Nginx reverse proxy with gzip & security headers
│
├── docs/                               # Architecture & Operations Guides
│   └── DEPLOYMENT_GUIDE.md             # Complete Production VPS & SSL setup guide
│
├── fluent-bit/                         # Fluent-Bit Log Shipper Configuration
│   ├── fluent-bit.conf                 # Syslog UDP & HTTP listener configuration
│   └── parsers.conf                    # Regex parsers for Apache, Syslog, JSON
│
├── log-simulator/                      # Heterogeneous Log & Attack Generator
│   ├── Dockerfile                      # Simulator container definition
│   ├── simulator.py                    # Main CLI simulator entrypoint
│   ├── attack_scenarios.py             # Multi-stage cyber attack scenario definitions
│   ├── aws_generator.py                # AWS CloudWatch/IAM/VPC log generator
│   ├── cctv_generator.py               # Physical CCTV security log generator
│   ├── firewall_generator.py           # Perimeter firewall dropped/allowed packet generator
│   ├── server_generator.py             # Linux/Windows auth & syslog generator
│   └── switch_generator.py             # L2/L3 switch link-flap & STP generator
│
└── opensearch/                         # OpenSearch Cluster Configuration
    └── index-template.json             # High-performance index mappings & analyzers
```

---

## 🎯 Viva & Evaluation Q&A Cheat Sheet

| Question | Answer & Technical Rationale |
| :--- | :--- |
| **Why did you build dual portals?** | Separation of duties. A SOC Analyst needs high-velocity triage tools (timelines, logs, IOC lookups, AI summaries) without administrative clutter. An Administrator requires infrastructure visibility (topology maps, health heartbeats, ingestion throttling, retention, and immutable audit logs). |
| **How does LogIntel achieve sub-second search across millions of logs?** | LogIntel leverages OpenSearch (an open-source distributed Lucene-based search engine) using inverted indices, keyword field analyzers, and date-range index partitioning (`logintel-logs-*`). For local development, it provides a seamless in-memory/SQLite full-text fallback. |
| **How does incident correlation prevent alert fatigue?** | Instead of bombarding the analyst with 100 individual "Failed Login" alerts, LogIntel's `correlation_service.py` clusters alerts sharing common attributes (e.g., origin IP `198.51.100.23` attacking `admin`) into a single **Incident** with a chronological kill chain. |
| **How is the Risk Score calculated?** | Using a multi-factor composite formula in `risk_service.py` that computes base severity + asset criticality multiplier + attack recurrence velocity + blast radius, normalizing to a clean 0–100 scale. |
| **How does the AI Explainer work?** | It analyzes the incident's correlated alerts, MITRE techniques, affected assets, and timeline sequence to generate a synthesized plain-language narrative, root-cause assessment, and actionable mitigation recommendations. |
| **What happens if OpenSearch goes down?** | The platform features a resilient dual-mode storage adapter. The API continues operating uninterrupted by falling back to local storage, ensuring zero downtime during demonstration or single-node evaluation. |

---

## 📜 License

Developed for the **Nexus Hackathon**. All rights reserved © 2026.
Designed and built by **Bhavsar Vishv Jigneshkumar** & **Sojitra Dhruvil Vipulbhai**.
