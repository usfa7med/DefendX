# 🛡 DefendX

### A real-time Web Application Firewall, Security Information & Event Manager, and Intrusion Detection System

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.7-FF6B35?style=for-the-badge&logo=hono&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-0F9D58?style=for-the-badge&logo=drizzle&logoColor=white)
![Critical](https://img.shields.io/badge/Critical-9-red?style=for-the-badge)
![High](https://img.shields.io/badge/High-9-orange?style=for-the-badge)
![Medium](https://img.shields.io/badge/Medium-9-yellow?style=for-the-badge)
![Low](https://img.shields.io/badge/Low-5-brightgreen?style=for-the-badge)

DefendX is a lightweight, self-hosted security gateway that sits between your application and the outside world. It ingests every incoming HTTP request, runs it through **18 independent threat detectors** (SQL injection, XSS, SSRF, command injection, XXE, and more), assigns a composite **risk score**, and takes graduated enforcement actions from silent logging to automatic IP bans. A built-in React dashboard provides real-time visibility into detections, incidents, blocked IPs, and traffic trends, so security operators can monitor and respond without leaving the browser.

---

## 📸 Screenshot

<p align="center">
  <img src="https://usfahmed.dev/assets/projects/defendx.png" width="100%" alt="DefendX Dashboard">
</p>

<p align="center"><em>The DefendX security dashboard real-time threat monitoring with interactive charts and drill-down detail.</em></p>

---

## 📑 Table of Contents

- [🌟 Features](#-features)
- [🎯 All Detected Vulnerabilities](#-all-detected-vulnerabilities-32)
- [🏗 Architecture](#-architecture)
- [🎥 Demo](#-demo)
- [📖 Case Study](#-case-study)
- [⚙️ Installation](#️-installation)
- [🚀 Usage](#-usage)
- [📂 Project Structure](#-project-structure)
- [⚠ Challenges & Solutions](#-challenges--solutions)
- [🔮 Future Improvements](#-future-improvements)
- [🛠 Technologies Used](#-technologies-used)
- [📄 License](#-license)
- [⚠ Disclaimer](#-disclaimer)
- [📫 Contact](#-contact)

---

## 🌟 Features

### 🛡 Multi-Layer Threat Detection Engine

- **18 independent detectors** running in sequence SQL injection, XSS, command injection, SSRF, XXE, LDAP injection, NoSQL injection, template injection, CRLF injection, open redirect, path traversal, sensitive file access, admin panel discovery, backup file discovery, config file discovery, cookie tampering, session abuse, and bot scanning
- Each detector inspects **query parameters, request body, form data, headers, cookies, and URL path** independently, flagging matches with field-level precision
- Pattern-based detection using **26+ regex signatures** for SQL injection alone (UNION SELECT, SLEEP(), BENCHMARK(), extractvalue, updatexml, ORDER BY, stacked queries) and **30+ patterns** for XSS (event handlers, data URIs, eval, document.cookie)

### 🎯 All Detected Vulnerabilities (32)

|  # | Vulnerability                      | Category                 |   Severity  | Score |
| -: | ---------------------------------- | ------------------------ | :---------: | ----: |
|  1 | Command Injection                  | Injection Attacks        | 🔴 Critical |    60 |
|  2 | SSRF (Server-Side Request Forgery) | Injection Attacks        | 🔴 Critical |    60 |
|  3 | XXE (XML External Entity)          | Injection Attacks        | 🔴 Critical |    60 |
|  4 | Path Traversal                     | Path Analysis            | 🔴 Critical |    50 |
|  5 | SQL Injection                      | Injection Attacks        | 🔴 Critical |    50 |
|  6 | XSS (Cross-Site Scripting)         | Injection Attacks        | 🔴 Critical |    50 |
|  7 | LDAP Injection                     | Injection Attacks        | 🔴 Critical |    50 |
|  8 | NoSQL Injection                    | Injection Attacks        | 🔴 Critical |    50 |
|  9 | Template Injection (SSTI)          | Injection Attacks        | 🔴 Critical |    50 |
| 10 | Brute Force                        | Authentication Attacks   |   🟠 High   |    40 |
| 11 | Credential Stuffing                | Authentication Attacks   |   🟠 High   |    40 |
| 12 | CRLF Injection                     | Injection Attacks        |   🟠 High   |    40 |
| 13 | Open Redirect                      | Injection Attacks        |   🟠 High   |    40 |
| 14 | Password Spraying                  | Authentication Attacks   |   🟠 High   |    35 |
| 15 | Sensitive Files Access             | Path Analysis            |   🟠 High   |    30 |
| 16 | Session Abuse                      | Session & Cookie Attacks |   🟠 High   |    30 |
| 17 | Burst Traffic                      | Rate Limiting            |   🟠 High   |    25 |
| 18 | Cookie Tampering                   | Session & Cookie Attacks |   🟠 High   |    25 |
| 19 | Account Enumeration                | Authentication Attacks   |  🟡 Medium  |    30 |
| 20 | Admin Panel Discovery              | Path Analysis            |  🟡 Medium  |    25 |
| 21 | Backup File Discovery              | Path Analysis            |  🟡 Medium  |    25 |
| 22 | Configuration File Discovery       | Path Analysis            |  🟡 Medium  |    25 |
| 23 | Suspicious User-Agent              | Request Layer            |  🟡 Medium  |    20 |
| 24 | Rate Limit – RPM                   | Rate Limiting            |  🟡 Medium  |    20 |
| 25 | Rate Limit – RPS                   | Rate Limiting            |  🟡 Medium  |    20 |
| 26 | Suspicious Host Header             | Request Layer            |  🟡 Medium  |    15 |
| 27 | Bot Scanning                       | Bot & Scanning           |  🟡 Medium  |    15 |
| 28 | Invalid HTTP Method                | Request Layer            |    🟢 Low   |    10 |
| 29 | Large Request Size                 | Request Layer            |    🟢 Low   |    10 |
| 30 | Too Many Headers                   | Request Layer            |    🟢 Low   |    10 |
| 31 | Duplicate Headers                  | Request Layer            |    🟢 Low   |    10 |
| 32 | Missing User-Agent                 | Request Layer            |    🟢 Low   |     5 |

---

### 📊 Composite Risk Scoring & Graduated Enforcement

- All detector scores are summed into a **single composite risk score** per request
- A 5-tier action table maps scores to enforcement: **log** (0–20), **warning** (21–40), **soft rate limit** (41–60), **temporary ban** (61–80), **permanent ban** (81+)
- IP blocking uses **escalating ban durations** 10 minutes → 1 hour → 24 hours → permanent after **4+ offenses**
- **Accumulated score threshold** (100 points) triggers automatic blocking for repeat offenders even if individual requests score low

### 🔐 Authentication Attack Detection

- **Brute force** detection flags IPs with **5+ login attempts** within a 15-minute sliding window
- **Credential stuffing** detection triggers when the same IP hits **3+ different login paths** with **10+ attempts**
- **Account enumeration** detection identifies IPs probing multiple login endpoints with **3+ attempts across 2+ paths**
- **Password spraying** detection catches slow-and-low attacks spread across **5+ minutes** with **8+ attempts**

### ⚡ Rate Limiting & Burst Detection

- **RPM threshold** flags IPs exceeding **100 requests per minute**
- **RPS threshold** flags IPs exceeding **20 requests per second**
- **Burst traffic** detection catches **50+ requests in a single 1-second window**
- In-memory sliding window counters with **automatic cleanup** every 60 seconds

### 🔍 IP Intelligence & Geo Lookup

- **Real-time geolocation** via ip-api.com resolves country and city for every request IP
- **Private network detection** automatically classifies RFC 1918 ranges (10.x, 172.16–31.x, 192.168.x)
- **IP statistics tracking** total requests, failed/successful logins, cumulative risk score, total blocks, first/last seen timestamps
- **Whitelist management** trusted IPs bypass all analysis and logging entirely

### 🖥 Security Dashboard

- **Overview page** traffic & threat charts, top offending IPs, top attack types, recent detections
- **Request Logs** filterable, searchable archive with CSV export and drill-down detail modals
- **Detections** severity breakdown (critical/high/medium/low counts), detector-level filtering, search across IPs and paths
- **Incidents** security event log with severity, action taken, and resolution status
- **Access Control** IP ban management with manual block/unblock and block type selection
- **Whitelist** trusted node management with cross-list detection (auto-unblocks if an IP is both blocked and whitelisted)

### 🏗 Security Hardening

- **Security headers** HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, Origin-Agent-Cluster, CSP
- **API key authentication** all endpoints (except `/health`) require a `defendx-api-key` header
- **Health check endpoint** database connectivity monitoring with uptime reporting
- **CORS** enabled for frontend integration
- **GSAP page transitions** smooth entrance animations on route changes
- **Mobile detection notice** prompts desktop use for optimal experience

---

## 🏗 Architecture

```text
                    ┌──────────────┐
                    │   Client /   │
                    │  Reverse     │
                    │  Proxy       │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Hono API   │
                    │  (Backend)   │
                    │              │
                    │  Middleware:  │
                    │  • CORS       │
                    │  • Security   │
                    │    Headers    │
                    │  • Logger     │
                    │  • API Key    │
                    │  • Error      │
                    │    Handler    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ Request  │ │  Geo     │ │  Block   │
       │ Processor│ │  Lookup  │ │  Check   │
       └────┬─────┘ └──────────┘ └──────────┘
            │
            ▼
       ┌──────────────────────────┐
       │   Detection Engine       │
       │   (18 detectors)         │
       │                          │
       │  Request Layer           │
       │  Rate Limiter            │
       │  Auth Attacks            │
       │  Path Analysis           │
       │  SQL Injection           │
       │  XSS                     │
       │  Command Injection       │
       │  SSRF                    │
       │  LDAP Injection          │
       │  NoSQL Injection         │
       │  Template Injection      │
       │  XXE                     │
       │  CRLF Injection          │
       │  Open Redirect           │
       │  Cookie Tampering        │
       │  Session Abuse           │
       │  Bot Scanning            │
       └────────────┬─────────────┘
                    │
                    ▼
       ┌──────────────────────────┐
       │    Risk Scorer           │
       │  score → action table    │
       └────────────┬─────────────┘
                    │
                    ▼
       ┌──────────────────────────┐
       │   Action Handler         │
       │  • log / warning         │
       │  • soft_rate_limit       │
       │  • temporary_ban         │
       │  • permanent_ban         │
       │  • IP stats update       │
       │  • Incident logging      │
       └────────────┬─────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  PostgreSQL   │
            │  (Drizzle)    │
            └──────────────┘
```

A non-obvious design decision: the system uses **in-memory sliding window counters** for rate limiting rather than database-backed counters, trading persistence for sub-millisecond evaluation speed. Rate limit data is ephemeral and resets on server restart a deliberate choice since persistent rate limiting would require a Redis/Memcached dependency.

---

## 🎥 Demo

### Quick Start (cURL walkthrough)

**1. Submit a log entry:**
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -H "defendx-api-key: YOUR_API_KEY" \
  -d '{
    "ip": "192.168.1.100",
    "method": "GET",
    "path": "/admin",
    "user_agent": "Mozilla/5.0",
    "host": "example.com"
  }'
```

**2. Submit an attack payload:**
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -H "defendx-api-key: YOUR_API_KEY" \
  -d '{
    "ip": "10.0.0.50",
    "method": "POST",
    "path": "/login",
    "query_string": "user=admin%27+OR+1%3D1--",
    "body": {"username": "admin' OR '1'='1"},
    "user_agent": "sqlmap/1.0",
    "host": "example.com"
  }'
```

**3. Check the response:**
```json
{
  "success": true,
  "request_id": "...",
  "risk_score": 90,
  "action_taken": "temporary_ban",
  "detections_count": 2,
  "detections": [
    { "detector_name": "SQL Injection", "severity": "critical", "score": 50 },
    { "detector_name": "Suspicious User-Agent", "severity": "medium", "score": 20 }
  ]
}
```

---

## 📖 Case Study

[![Case Study](https://img.shields.io/badge/Read-Case%20Study-blue?style=for-the-badge)](https://usfahmed.dev/projects/DefendX)

The case study covers the design and implementation of the multi-layer threat detection engine, the risk scoring model, and the graduated enforcement system.

---

## ⚙️ Installation

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14
- **npm** ≥ 10

### 1. Clone the repository

```bash
git clone https://github.com/usfa7med/DefendX.git
cd DefendX
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env`:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/defendx` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `DEFENDX_API_KEY` | API key for authentication | `your-secret-key-here` |

Edit `frontend/.env`:

| Variable | Description | Example |
|---|---|---|
| `VITE_DEFENDX_API_KEY` | API key (must match backend) | `your-secret-key-here` |

### 5. Push the database schema

```bash
cd backend
npm run db:push
```

---

## 🚀 Usage

### Start the backend server

```bash
cd backend
npm run dev
```

The server starts at `http://localhost:3000` and displays a startup banner with the port and mode.

### Start the frontend

```bash
cd frontend
npm run dev
```

The dashboard is available at `http://localhost:5173`.

### Production build

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

### Using the service

1. Open the dashboard at `http://localhost:5173`
2. The **Overview** page displays real-time traffic and threat data
3. Use the **Logs** page to search, filter, and export request logs
4. The **Detections** page shows all flagged threats with severity breakdown
5. Use **Access Control** to manually block/unblock IPs
6. Use **Whitelist** to exempt trusted IPs from analysis

---

## 📂 Project Structure

```text
DefendX/
├── backend/
│   ├── drizzle.config.ts          # Drizzle Kit configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Server entry point
│       ├── app.ts                 # Hono app with middleware & routes
│       ├── config/
│       │   ├── index.ts           # Environment variable loader
│       │   ├── detectors.ts       # Detector configurations & thresholds
│       │   └── protection.ts      # IP protection rules, ban durations, exclusions
│       ├── db/
│       │   ├── index.ts           # Drizzle client + PostgreSQL connection
│       │   └── schema.ts          # Full database schema (10 tables)
│       ├── engine/
│       │   ├── processor.ts       # Request processing pipeline
│       │   ├── risk-scorer.ts     # Score → action mapping
│       │   ├── action-handler.ts  # Ban/whitelist/incident logic
│       │   └── detectors/         # 18 independent threat detectors
│       │       ├── index.ts       # Detector registry & runner
│       │       ├── sql-injection.ts
│       │       ├── xss.ts
│       │       ├── command-injection.ts
│       │       ├── ssrf.ts
│       │       ├── path-analysis.ts
│       │       ├── auth-attacks.ts
│       │       ├── rate-limiter.ts
│       │       ├── bot-scanning.ts
│       │       └── ... (8 more)
│       ├── middleware/
│       │   ├── api-key.ts         # API key authentication
│       │   ├── security-headers.ts # Security header injection
│       │   ├── logger.ts          # Request logging middleware
│       │   └── error-handler.ts   # Global error handler
│       ├── routes/
│       │   ├── logs.ts            # Log ingestion + retrieval + detail
│       │   ├── detections.ts      # Detection query + search
│       │   ├── incidents.ts       # Incident log
│       │   ├── blocked-ips.ts     # IP ban CRUD
│       │   ├── whitelist.ts       # Whitelist CRUD
│       │   ├── stats.ts           # Dashboard + aggregation endpoints
│       │   └── health.ts          # Health check
│       └── utils/
│           ├── types.ts           # TypeScript interfaces
│           ├── helpers.ts         # ID generation, string parsing
│           ├── ip-utils.ts        # IP validation, CIDR matching, localhost detection
│           └── geo.ts             # GeoIP lookup via ip-api.com
├── frontend/
│   ├── vite.config.ts             # Vite + React + TailwindCSS
│   ├── index.html
│   └── src/
│       ├── main.tsx               # React entry point
│       ├── App.tsx                # Router, page transitions, mobile notice
│       ├── index.css              # TailwindCSS + custom theme
│       ├── lib/
│       │   ├── api.ts             # Fetch wrapper with API key injection
│       │   └── utils.ts           # cn(), formatNumber(), timeAgo()
│       ├── types/
│       │   └── index.ts           # Frontend TypeScript interfaces
│       ├── components/
│       │   ├── Layout.tsx         # Sidebar + header + Outlet wrapper
│       │   ├── StatsCard.tsx      # Stats card with trend + sparkline
│       │   ├── LogDetailModal.tsx # Portal-based log detail with tabs
│       │   ├── ActionBadge.tsx    # Action taken badge
│       │   ├── SeverityBadge.tsx  # Severity indicator badge
│       │   ├── Pagination.tsx     # Pagination controls
│       │   ├── Table.tsx          # Reusable table wrapper
│       │   └── ConfirmDialog.tsx  # Confirmation dialog
│       └── pages/
│           ├── Dashboard.tsx      # Overview with charts, top IPs, attacks
│           ├── Logs.tsx           # Request log archive + filters
│           ├── Detections.tsx     # Detection list with severity counts
│           ├── Incidents.tsx      # Incident log
│           ├── BlockedIPs.tsx     # IP ban management
│           ├── Whitelist.tsx      # Trusted IP management
│           └── NotFound.tsx       # 404 page
└── .gitignore
```

---

## ⚠ Challenges & Solutions

### Problem

The risk scoring model needed to balance sensitivity (catching real threats) against false positives (legitimate requests flagged as malicious). A single high-scoring detector could trigger an aggressive ban on a mostly-clean request.

### Solution

DefendX uses a **cumulative scoring model** where all detector scores are summed, combined with a **5-tier graduated enforcement table**. This means a single low-confidence detection (score 10) logs quietly, while multiple overlapping detections escalate naturally. The system also maintains **IP-level accumulated scores** that trigger automatic bans only after repeated offenses preventing one-off false positives from causing permanent damage.

### Problem

Rate limiting needs to evaluate hundreds of requests per second without adding database latency. Traditional database-backed rate limiters introduce query overhead that becomes a bottleneck under high traffic.

### Solution

DefendX uses **in-memory sliding window counters** with `Map<string, timestamps[]>` structures for RPM, RPS, and burst detection. Entries are cleaned up on every evaluation (filtering expired timestamps) and periodically purged every 60 seconds. This keeps rate limit evaluation under **sub-millisecond** performance at the cost of ephemeral state acceptable for a single-instance WAF.

### Problem

The frontend needed to display detailed log information (headers, cookies, fields, detections) without navigating away from the log list, and the data volume could be large (hundreds of fields per request).

### Solution

A **React Portal-based modal** (`LogDetailModal`) renders outside the main layout with a tabbed interface (detections, headers, cookies, fields). This keeps the log table interactive while providing drill-down detail. The modal also includes a **risk gauge SVG** that visually represents the composite score with color-coded thresholds.

---

## 🔮 Future Improvements

- Move rate limiting to **Cloudflare Durable Objects** or **Redis** for distributed, persistent rate limiting across multiple instances
- Add **WebSocket support** for real-time dashboard updates without polling
- Implement **ML-based anomaly detection** using historical request patterns to identify zero-day attack vectors
- Add **webhook integrations** to notify Slack, Discord, or email on critical detections
- Support **IPv6** address range blocking and CIDR notation in the ban system
- Add **custom detector plugins** allow users to write and register their own detection rules via configuration
- Implement **log retention policies** with automatic archival and cleanup of old request data
- Add **multi-tenant support** with per-project API keys and isolated databases

---

## 🛠 Technologies Used

### Backend

- **Runtime**: Node.js 22, TypeScript 5.8
- **Framework**: Hono 4.7 (ultra-lightweight, edge-ready)
- **Database**: PostgreSQL 16, Drizzle ORM 0.44
- **Validation**: Native TypeScript type guards

### Frontend

- **Framework**: React 19, TypeScript 6.0
- **Build Tool**: Vite 8.1
- **Styling**: TailwindCSS 4.3, custom Material Design 3-inspired theme
- **Charts**: Recharts 3.9 (AreaChart for traffic trends)
- **Animation**: GSAP 3.15 (page transitions, brand animation)
- **Icons**: Lucide React 1.24, Phosphor Icons 2.1

### Infrastructure

- **Database Driver**: postgres.js 3.4
- **GeoIP**: ip-api.com (free, no API key required)
- **Schema Migrations**: Drizzle Kit 0.30

---

## 📄 License

This project is licensed under the **Educational / All Rights Reserved** License. Unauthorized copying, redistribution, or commercial use is prohibited. See the [`LICENSE`](LICENSE) file for full details.

---

## ⚠ Disclaimer

DefendX is provided strictly for **educational and research purposes**. It is not a production-grade WAF and should not be used as the sole security layer for any real-world application. The detection patterns are heuristic-based and may produce false positives or miss novel attack vectors. Users are solely responsible for any damage, data loss, or security incidents resulting from the use or misuse of this software. Always complement DefendX with a proven production WAF (e.g., Cloudflare, AWS WAF, ModSecurity) in any real deployment.

---

## 📫 Contact

**Youssef Ahmed Abdelfatah**

🌐 **Portfolio**
https://usfahmed.dev

💻 **GitHub**
https://github.com/usfa7med

💼 **LinkedIn**
https://linkedin.com/in/usfahmed

✉️ **Email**
hello@usfahmed.dev
