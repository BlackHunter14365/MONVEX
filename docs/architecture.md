# MONVEX Architecture Specification

## 1. System Overview

MONVEX is an AI-powered personal financial intelligence and decision support platform engineered with a single authoritative core backend and multi-platform client interfaces (Web, Windows Desktop, Android).

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  +---------------------+   +---------------------+   +---------------+  |
|  |   Next.js Web App   |   | Tauri Windows App   |   | Flutter (App) |  |
|  | (Tailwind + GSAP)   |   | (React + Tailwind)  |   | (Offline-1st) |  |
|  +----------+----------+   +----------+----------+   +-------+-------+  |
+-------------|-------------------------|----------------------|----------+
              |                         |                      |
              +-------------------------+----------------------+
                                        | HTTPS / WSS / JWT
+---------------------------------------v---------------------------------+
|                             API GATEWAY / DRF                           |
|                      (/api/v1/ - Authentication & ACL)                  |
+---------------------------------------+---------------------------------+
                                        |
+---------------------------------------v---------------------------------+
|                               SERVICE LAYER                             |
|  +--------------------+  +--------------------+  +-------------------+  |
|  | TransactionService |  |   FinanceService   |  |   BudgetService   |  |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |  ForecastService   |  |   AnomalyService   |  | AICopilotService  |  |
|  +--------------------+  +--------------------+  +-------------------+  |
+---------------------------------------+---------------------------------+
                                        |
+-------------------+-------------------+-------------------+-------------+
|                   |                   |                   |             |
v                   v                   v                   v             v
+-------------+     +-------------+     +-------------+     +-------------+     +-------------+
| PostgreSQL  |     | Redis Queue |     | Celery      |     | ML Engines  |     | Gemini API  |
| (Primary DB)|     | & Pub/Sub   |     | Workers     |     | (TF-IDF/NB) |     | & ADK Tools |
+-------------+     +-------------+     +-------------+     +-------------+     +-------------+
```

## 2. Core Architectural Principles

1. **Three Clients, One Backend**:
   All business logic, financial models, validation, and analytics reside within the unified Django service layer. No client implements bespoke business logic.
2. **Deterministic Calculations vs. AI Explanations**:
   - Financial mathematics (aggregations, health scores, velocities, scenario calculations) are 100% deterministic and unit-tested.
   - Generative AI (Gemini / ADK) is restricted to reasoning, natural language translation, query orchestration, and providing human-friendly financial explanations.
3. **Controlled Tool Invocation**:
   AI agents interact with user data strictly through parameterized, read-only internal service tools. Unrestricted database access (e.g. raw SQL generation) is forbidden.
4. **Dynamic Data Flow**:
   Any mutation to a financial entity (Transaction, Budget, Goal) immediately triggers recalculation of derived state and pushes real-time WebSocket events to active client sessions.
