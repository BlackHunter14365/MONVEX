# MONVEX: AI-Powered Personal Financial Intelligence & Decision Platform

> **Core Product Thesis:** Financial Data → Financial Intelligence → Financial Decision

---

## Monorepo Architecture

```
d:/MONVEX/
├── docs/                             # Engineering & Architectural Specifications
│   ├── architecture.md               # Multi-platform & service-layer contracts
│   ├── database.md                   # Relational schema & constraints
│   ├── api.md                        # REST API (v1) endpoint definitions
│   ├── ai-agents.md                  # Gemini & controlled tool orchestration
│   └── security.md                   # Security & multi-tenant isolation
├── backend/                          # Production Django 5 Service Layer
│   ├── monvex/                       # Settings, Security, URLs, WSGI/ASGI
│   ├── apps/                         # Modular Django Apps (auth, transactions, budgets, goals, analytics, ai_copilot)
│   ├── services/                     # Business logic (Transaction, Budget, Finance, Forecast, Anomaly, AI Copilot)
│   ├── ml/                           # Scikit-Learn TF-IDF + Naive Bayes Categorizer
│   ├── tests/                        # Automated unit & integration tests (15/15 passing)
│   └── Dockerfile                    # Production multi-stage container
├── web/                              # Next.js 14 Web Application
│   ├── src/app/                      # App router (Landing, Dashboard, Ledger, Budgets, Goals, Forecast, Auth)
│   ├── src/components/               # UI components (Navigation, Charts, CopilotDrawer, AddTransactionModal)
│   └── Dockerfile                    # Standalone production container
├── desktop/                          # Native Cross-Platform Desktop (Tauri + Rust)
│   ├── src-tauri/                    # Rust backend, system tray & window handlers
│   └── package.json                  # Desktop build scripts
├── mobile/                           # Cross-Platform Mobile Client (Flutter)
│   ├── lib/                          # Clean architecture (Core, Models, Screens)
│   └── pubspec.yaml                  # Flutter dependencies
└── deploy/                           # Enterprise Production Deployment
    ├── docker-compose.yml            # Web, Backend, PostgreSQL 16, Redis 7, Nginx
    ├── nginx/                        # Reverse proxy & rate limiting configuration
    └── .env.production.example       # Production environment template
```

---

## Getting Started

### 1. Backend Setup
```powershell
cd d:\MONVEX\backend
& ".\.venv\Scripts\python.exe" manage.py migrate
& ".\.venv\Scripts\python.exe" manage.py seed_demo_data
& ".\.venv\Scripts\python.exe" manage.py runserver 8000
```

### 2. Web Client
```powershell
cd d:\MONVEX\web
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Docker Production Deployment
```powershell
cd d:\MONVEX\deploy
docker compose up --build -d
```

### 4. Running Automated Tests
```powershell
cd d:\MONVEX\backend
& ".\.venv\Scripts\python.exe" manage.py test tests
```

---

## Multi-Platform Capabilities

| Platform | Tech Stack | Status |
| :--- | :--- | :--- |
| **Web** | Next.js 14 + Tailwind CSS + GSAP + Recharts | Ready (12 static routes) |
| **Desktop** | Tauri + Rust native shell + System Tray | Ready (`desktop/`) |
| **Mobile** | Flutter + Clean Architecture + Secure JWT | Ready (`mobile/`) |
| **Backend** | Django 5 + DRF + ML Categorizer + Gemini | Ready (15/15 tests passing) |
