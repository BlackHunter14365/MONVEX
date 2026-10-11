# MONVEX Academic Documentation Research Dossier
## Master Index & Technical Audit Baseline

> **Project Name:** MONVEX — AI-Powered Personal Financial Intelligence System  
> **Degree Target:** B.Sc. Computer Science (Semester VI Project Documentation)  
> **Prescribed Syllabus / Academic Guide:** Mumbai University / Affiliated B.Sc. CS Project Guidelines  
> **Inspection Date:** October 12, 2026  
> **Repository Root:** `d:\MONVEX`  
> **Git Branch:** `master`  
> **Git Head Commit:** `1078a9a (feat(neon): initialize neon project configuration, skills, and deployed functions)`  
> **Lead Researcher / Architect:** Senior Software Architect & Technical Documentation Analyst  

---

## 1. Executive Research Overview

This dossier forms the comprehensive, evidence-backed technical foundation compiled to author the official **Semester VI B.Sc. Computer Science Final Project Report** for **MONVEX**. 

In strict adherence to academic research integrity, every architectural diagram, database schema table, functional requirement, testing ledger, and technology survey entry in this dossier is traced directly to the active source code, automated test suite executions, or physical configuration artifacts in the repository.

### Academic Template Authority & Reference Hierarchy
1. **Primary Authority:** College Prescribed Syllabus Format (`Format for Final Project Documentation Sem6.pdf`).
   - Mandates strict 8-Chapter structure with specific subsections.
   - Enforces specific academic front matter (Proforma, Certificates, Declaration, Abstract).
   - Contains structural template anomalies preserved and flagged for guide review (e.g., Chapter 6 labeled "SYSTEM DESIGN" for Test Reports, and Chapter 7 hierarchical numbering).
2. **Structural & Presentation Reference:** `LearnWithShubh_Original_Documentation_Updated.pdf`.
   - Used strictly for formatting layout, depth of technical explanation, testing matrix styling, and citation presentation.
   - **Zero project-specific content, diagrams, or text copied.**

---

## 2. Evidence & Verification Taxonomy

Every technical finding and requirement in this dossier is tagged with one of eight standardized verification labels:

| Label | Status Code | Definition & Criteria |
| :--- | :---: | :--- |
| **VERIFIED FROM SOURCE** | `[V-SRC]` | The implementation is directly present, readable, and verified in active source files. |
| **VERIFIED BY TEST** | `[V-TST]` | An automated unit, integration, or E2E test was executed and passed with documented evidence. |
| **CONFIGURATION PRESENT** | `[V-CFG]` | A configuration file (YAML, JSON, Dockerfile) exists, specifying settings or runtime targets. |
| **USER-REPORTED** | `[V-USR]` | Behavior was reported by operator or user, but automated verification is pending. |
| **PARTIALLY IMPLEMENTED** | `[V-PART]` | Component or service skeleton exists, but secondary features or integrations are incomplete. |
| **PLANNED OR FUTURE** | `[V-FUT]` | Feature is architecturally outlined in roadmaps or comments but not implemented in code. |
| **UNVERIFIED** | `[V-UNV]` | Code or script exists, but execution was blocked or omitted due to environment constraints. |
| **NOT FOUND** | `[V-NF]` | Component was referenced in prior legacy notes but does not exist in the active working tree. |

---

## 3. Repository Baseline & Component Discovery

Physical inspection of the repository root (`d:\MONVEX`) revealed the following application component boundaries:

```
d:\MONVEX
├── backend/                  [VERIFIED ACTIVE] Django 5.2 REST Framework API + Gunicorn
│   ├── apps/                 7 Core Django Applications (Auth, Trans, Budget, Goals, AI, etc.)
│   ├── ml/                   Scikit-Learn TF-IDF + Naive Bayes Transaction Categorizer Engine
│   ├── monvex/               Root WSGI/ASGI Settings, URL routing, Custom Exception Handlers
│   ├── services/             23 Domain Business Logic & AI Orchestration Services
│   └── tests/                12 Test Modules (180 passing automated test cases)
├── web/                      [VERIFIED ACTIVE] Next.js 14.2 Standalone SSR Web Application
│   ├── src/app/              28 Application App-Router Page Routes (Public & Protected)
│   ├── src/components/       Atomic, Layout, Motion & Financial UI Components
│   ├── src/hooks/queries/    15 TanStack Query Hooks for Asynchronous Cache Management
│   └── scripts/              Playwright E2E Headless Browser Testing Scripts
├── desktop/                  [VERIFIED ACTIVE] Tauri 1.6 / Rust Windows Native Desktop Wrapper
│   └── src-tauri/            Rust Core, WebView2 Bindings, System Tray & Window Controls
├── mobile/                   [NOT FOUND IN WORKING TREE - PRESENT IN GIT HISTORY]
│                             Flutter Android Project tracked in Git history (HEAD:mobile),
│                             currently deleted in local active working tree.
├── docs/project-documentation/ Master Academic Documentation Dossier (17 Dossier Modules)
└── render.yaml               [VERIFIED ACTIVE] Production Render Dual-Web-Service Blueprint
```

---

## 4. Master Dossier Navigation Directory

This research repository is organized into 17 modular documents, corresponding to the required sections of the final academic report:

| # | Dossier Document | Primary Academic Mapping | File Link |
| :---: | :--- | :--- | :--- |
| **01** | **Research Index & Baseline** | Master Overview & Methodology | [`DOCUMENTATION_RESEARCH_INDEX.md`](file:///d:/MONVEX/docs/project-documentation/DOCUMENTATION_RESEARCH_INDEX.md) |
| **02** | **Project Architecture** | Chapter 1.5, Chapter 4.1 | [`PROJECT_ARCHITECTURE.md`](file:///d:/MONVEX/docs/project-documentation/PROJECT_ARCHITECTURE.md) |
| **03** | **Feature Inventory** | Chapter 1.3, Chapter 3.5, Chapter 4.1 | [`FEATURE_INVENTORY.md`](file:///d:/MONVEX/docs/project-documentation/FEATURE_INVENTORY.md) |
| **04** | **Requirements Catalog** | Chapter 3.1, 3.2, 3.4 | [`REQUIREMENTS_CATALOG.md`](file:///d:/MONVEX/docs/project-documentation/REQUIREMENTS_CATALOG.md) |
| **05** | **Database & Data Design** | Chapter 4.2, 4.2.1 | [`DATABASE_AND_DATA_DESIGN.md`](file:///d:/MONVEX/docs/project-documentation/DATABASE_AND_DATA_DESIGN.md) |
| **06** | **API & Integration Inventory** | Chapter 4.1, Chapter 5.1 | [`API_AND_INTEGRATION_INVENTORY.md`](file:///d:/MONVEX/docs/project-documentation/API_AND_INTEGRATION_INVENTORY.md) |
| **07** | **Diagram Specifications** | Chapter 3.6 (All 6 Conceptual Models) | [`DIAGRAM_SPECIFICATIONS.md`](file:///d:/MONVEX/docs/project-documentation/DIAGRAM_SPECIFICATIONS.md) |
| **08** | **UI Screenshot Register** | Chapter 4.3 (GUI Screenshots) | [`UI_SCREENSHOT_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/UI_SCREENSHOT_REGISTER.md) |
| **09** | **Implementation File Map** | Chapter 5.1.1 (Code Details) | [`IMPLEMENTATION_FILE_MAP.md`](file:///d:/MONVEX/docs/project-documentation/IMPLEMENTATION_FILE_MAP.md) |
| **10** | **Testing & Evidence Register** | Chapter 5.2, Chapter 6.1 | [`TESTING_AND_EVIDENCE_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/TESTING_AND_EVIDENCE_REGISTER.md) |
| **11** | **Security & Privacy Findings** | Chapter 3.2 (NFR), Chapter 4.2.1 | [`SECURITY_AND_PRIVACY_FINDINGS.md`](file:///d:/MONVEX/docs/project-documentation/SECURITY_AND_PRIVACY_FINDINGS.md) |
| **12** | **Deployment & Environment** | Chapter 3.4, Chapter 5.1 | [`DEPLOYMENT_AND_ENVIRONMENT.md`](file:///d:/MONVEX/docs/project-documentation/DEPLOYMENT_AND_ENVIRONMENT.md) |
| **13** | **References Register** | Chapter 8 (Academic References) | [`REFERENCES_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/REFERENCES_REGISTER.md) |
| **14** | **Academic Information Checklist** | Front Matter (Certificates/Guide) | [`ACADEMIC_INFORMATION_CHECKLIST.md`](file:///d:/MONVEX/docs/project-documentation/ACADEMIC_INFORMATION_CHECKLIST.md) |
| **15** | **Documentation Gap Report** | Traceability & Risk Assessment | [`DOCUMENTATION_GAP_REPORT.md`](file:///d:/MONVEX/docs/project-documentation/DOCUMENTATION_GAP_REPORT.md) |
| **16** | **Chapter Evidence Map** | Chapter-by-Chapter Writing Guide | [`CHAPTER_EVIDENCE_MAP.md`](file:///d:/MONVEX/docs/project-documentation/CHAPTER_EVIDENCE_MAP.md) |
| **17** | **Research Completion Report** | Final Summary & Hand-off | [`RESEARCH_COMPLETION_REPORT.md`](file:///d:/MONVEX/docs/project-documentation/RESEARCH_COMPLETION_REPORT.md) |

---

## 5. College Template Inconsistencies & Flags

During audit against `Format for Final Project Documentation Sem6.pdf`, two formal inconsistencies were identified in the prescribed syllabus template:

1. **Chapter 6 Title Inconsistency:**
   - **Template Label:** `CHAPTER 6: SYSTEM DESIGN`
   - **Contained Subsection:** `6.1 Test Reports`
   - **Observation:** Chapter 4 is already labeled `SYSTEM DESIGN`. Standard academic convention titles Chapter 6 `TESTING AND RESULTS` or `TEST REPORTS`.
   - **Dossier Resolution:** The prescribed template structure is strictly retained in this dossier, with an explicit advisory footnote created in [`CHAPTER_EVIDENCE_MAP.md`](file:///d:/MONVEX/docs/project-documentation/CHAPTER_EVIDENCE_MAP.md) for student/guide sign-off.
2. **Chapter 7 Subsection Hierarchy Anomaly:**
   - **Template Numbering:**
     - `7.1 Conclusion`
     - `7.1.1 Significance of the System (Advantages)`
     - `7.1.2 Limitations of the System`
     - `7.1.3 Future Scope of the Project`
   - **Observation:** Subsections 7.1.1–7.1.3 are nested under 7.1 without a corresponding 7.2.
   - **Dossier Resolution:** Retained verbatim to match evaluation rubrics, with placeholder options documented.
