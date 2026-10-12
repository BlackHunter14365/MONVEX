# MONVEX Chapter-by-Chapter Evidence & Writing Blueprint

> **Dossier Document:** 16  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Master Writing Guide for All 8 Chapters  

---

## 1. Master Academic Mapping Architecture

This blueprint guides the seamless drafting of the final Semester VI project report, mapping every prescribed subsection directly to the corresponding technical findings, source code files, and verified evidence files in this dossier.

---

## 2. Chapter-Wise Detailed Writing Blueprint

### CHAPTER 1: INTRODUCTION
* **1.1 Background**
  - *Content:* History of personal bookkeeping; evolution from pen-and-paper ledgers to spreadsheets and modern fintech; challenges of financial anxiety and cognitive load in manual tracking.
  - *Evidence Source:* [`REQUIREMENTS_CATALOG.md`](file:///d:/MONVEX/docs/project-documentation/REQUIREMENTS_CATALOG.md) (Section 1.1).
* **1.2 Objectives**
  - *Content:* Four core goals: (1) Automate receipt and natural language entry; (2) Provide algorithmic health scoring (0–100); (3) Offer conversational financial copilot reasoning; (4) Guarantee bank-grade privacy and multi-tenant isolation.
  - *Evidence Source:* [`FEATURE_INVENTORY.md`](file:///d:/MONVEX/docs/project-documentation/FEATURE_INVENTORY.md).
* **1.3 Purpose, Scope and Applicability**
  - **1.3.1 Purpose:** Eliminate manual friction and empower users with explainable financial decision support.
  - **1.3.2 Scope:** Multi-asset net worth tracking, debt payoff optimization, receipt OCR, budget variance, and multi-turn AI advice. Scope explicitly excludes live banking APIs (Open Banking), trading bots, or speculative crypto execution.
  - **1.3.3 Applicability:** Salaried professionals, students, freelancers, and small household managers seeking holistic cashflow clarity.
* **1.4 Achievement**
  - *Content:* Factual achievements: 20 verified features, 180 passing backend automated tests, 24 passing E2E Playwright tests, zero security vulnerabilities in dependencies, standalone compilation.
  - *Evidence Source:* [`TESTING_AND_EVIDENCE_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/TESTING_AND_EVIDENCE_REGISTER.md).
* **1.5 Organization of Reports**
  - *Content:* Structural summary describing Chapters 2 through 8.

---

### CHAPTER 2: SURVEY OF TECHNOLOGIES
* *Content:* In-depth technical rationale and evaluation of all technologies actually discovered in the codebase:
  1. **Next.js 14 & React 18:** Standalone output, App Router, SSR, streaming hydration.
  2. **TypeScript 5.5:** Static type contracts, compile-time safety.
  3. **Tailwind CSS 3.4 & Framer Motion 13:** Responsive utility architecture, design tokens, micro-motion.
  4. **TanStack Query v5:** Asynchronous server cache management, optimistic updates.
  5. **Django 5.2 & Django REST Framework 3.18:** Python web application framework, modular apps, ORM.
  6. **SimpleJWT & PyOTP:** Stateless Bearer tokens with HttpOnly refresh cookies, RFC 6238 TOTP 2FA.
  7. **Neon Serverless PostgreSQL 16:** Serverless branching, connection pooling, SSL encryption.
  8. **Scikit-Learn 1.9 & NumPy 2.5:** TF-IDF text vectorization, Multinomial Naive Bayes classifier.
  9. **Google Gemini 2.0 AI SDK:** Multimodal receipt OCR, conversational intelligence.
  10. **Tauri 1.6 & Rust:** Native Windows container with Microsoft Edge WebView2.
  11. **ReportLab 5.0:** Automated programmatic PDF statement generation.
  12. **Gunicorn 26.2 & WhiteNoise 6.12:** WSGI multi-worker server and hashed static asset distribution.
* *Evidence Source:* [`PROJECT_ARCHITECTURE.md`](file:///d:/MONVEX/docs/project-documentation/PROJECT_ARCHITECTURE.md), [`REFERENCES_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/REFERENCES_REGISTER.md).

---

### CHAPTER 3: REQUIREMENTS AND ANALYSIS
* **3.1 Problem Definition (Existing and Proposed System)**
  - *Content:* Comprehensive comparison table contrasting manual spreadsheets/traditional apps with MONVEX.
  - *Evidence Source:* [`REQUIREMENTS_CATALOG.md`](file:///d:/MONVEX/docs/project-documentation/REQUIREMENTS_CATALOG.md) (Section 1).
* **3.2 Requirement Specification**
  - *Content:* Numbered functional requirements (`FR-01` through `FR-18`) and non-functional requirements (`NFR-01` through `NFR-15`) with actors, preconditions, inputs, outputs, and acceptance criteria.
  - *Evidence Source:* [`REQUIREMENTS_CATALOG.md`](file:///d:/MONVEX/docs/project-documentation/REQUIREMENTS_CATALOG.md) (Sections 2 & 3).
* **3.3 Planning and Scheduling (Gantt Chart)**
  - *Content:* Project timeline covering Inception, System Design, Core Implementation, AI Integration, and Release Testing.
  - *Evidence Source:* [`REQUIREMENTS_CATALOG.md`](file:///d:/MONVEX/docs/project-documentation/REQUIREMENTS_CATALOG.md) (Section 5).
* **3.4 Hardware and Software Requirement**
  - *Content:* Development workstations, server runtimes, client devices, operating systems, and network specs.
  - *Evidence Source:* [`REQUIREMENTS_CATALOG.md`](file:///d:/MONVEX/docs/project-documentation/REQUIREMENTS_CATALOG.md) (Section 4).
* **3.5 Preliminary Product Description**
  - *Content:* High-level functional narrative describing subsystem capabilities.
* **3.6 Conceptual Models**
  - **3.6.1 Data Flow Diagram (DFD):** Context Level (0) and Functional Decomposition (Level 1).
  - **3.6.2 ER Diagram:** 13 physical entities with Crow's Foot cardinalities.
  - **3.6.3 Class Diagram:** Models, views, and domain service classes.
  - **3.6.4 Use Case Diagram:** Actors (Registered User, Visitor, Gemini AI) and core use cases.
  - **3.6.5 Sequence Diagram:** Traced multimodal receipt upload and ledger confirmation flow.
  - **3.6.6 System Flowchart:** Complete transaction processing and anomaly detection logic.
  - *Evidence Source:* [`DIAGRAM_SPECIFICATIONS.md`](file:///d:/MONVEX/docs/project-documentation/DIAGRAM_SPECIFICATIONS.md).

---

### CHAPTER 4: SYSTEM DESIGN
* **4.1 Basic Modules (Detailed Explanation)**
  - *Content:* Detailed technical write-up for each of the 10 core subsystems: Authentication & MFA, Transactions Ledger, Machine Learning Categorizer, Budgeting & Variance, Savings Goals, Health Score Engine, Net Worth Portfolio, Debt Planner, Receipt Studio, and AI Copilot.
  - *Evidence Source:* [`FEATURE_INVENTORY.md`](file:///d:/MONVEX/docs/project-documentation/FEATURE_INVENTORY.md), [`PROJECT_ARCHITECTURE.md`](file:///d:/MONVEX/docs/project-documentation/PROJECT_ARCHITECTURE.md).
* **4.2 Data Design**
  - *Content:* Full schema tables, field names, data types, nullability, defaults, unique constraints, and composite indexes.
  - **4.2.1 Data Integrity and Constraints:** Arbitrary decimal precision defense, multi-tenant isolation, referential cascade rules.
  - *Evidence Source:* [`DATABASE_AND_DATA_DESIGN.md`](file:///d:/MONVEX/docs/project-documentation/DATABASE_AND_DATA_DESIGN.md).
* **4.3 User Interface Design (GUI Screenshots)**
  - *Content:* High-resolution screenshots (`UI-01` through `UI-33`) covering desktop and mobile layouts, theme variants, and empty/loading states.
  - *Evidence Source:* [`UI_SCREENSHOT_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/UI_SCREENSHOT_REGISTER.md).

---

### CHAPTER 5: IMPLEMENTATION AND TESTING
* **5.1 Implementation Approaches**
  - **5.1.1 Coding Details and Code Efficiency:**
    - **5.1.1.1 Code Details:** Code directory mapping file responsibilities, key methods, and inputs/outputs.
    - **5.1.1.2 Code Efficiency:** Architectural patterns (Singleton categorizer, TanStack stale-time caching, composite DB indexing, WhiteNoise manifest hashing).
  - *Evidence Source:* [`IMPLEMENTATION_FILE_MAP.md`](file:///d:/MONVEX/docs/project-documentation/IMPLEMENTATION_FILE_MAP.md).
* **5.2 Testing Approach**
  - **5.2.1 Unit Testing:** Unit testing strategy using Django `TestCase` and Python `unittest`.
  - **5.2.2 Integrated Testing:** Cross-subsystem workflow testing with DRF `APIClient` and Playwright headless browser automation.
  - *Evidence Source:* [`TESTING_AND_EVIDENCE_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/TESTING_AND_EVIDENCE_REGISTER.md).

---

### CHAPTER 6: SYSTEM DESIGN (*Preserved College Template Label*)
> *Advisory Note:* Preserved as prescribed in college syllabus template; contains section 6.1 Test Reports.
* **6.1 Test Reports**
  - *Content:* Comprehensive testing matrix containing Unit Tests (`UT-01` to `UT-15`), Integration Tests (`IT-01` to `IT-08`), and End-to-End Tests (`E2E-01` to `E2E-10`) with preconditions, inputs, expected results, actual results, and PASS status.
  - *Evidence Source:* [`TESTING_AND_EVIDENCE_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/TESTING_AND_EVIDENCE_REGISTER.md).

---

### CHAPTER 7: CONCLUSIONS
* **7.1 Conclusion**
  - *Content:* Summary of project outcomes, validating that all planned objectives were achieved.
* **7.1.1 Significance of the System (Advantages)**
  - *Content:* Key benefits: Automated multimodal receipt ingestion, explainable AI advice, accurate financial health grading, and bank-grade privacy.
* **7.1.2 Limitations of the System**
  - *Content:* Real-world boundaries: Relies on cloud AI availability; lacks direct banking protocols (Plaid/Yodlee); avatar storage currently on container volume.
* **7.1.3 Future Scope of the Project**
  - *Content:* Realistic roadmap: Direct Open Banking account aggregation, FIDO2 WebAuthn biometric passkeys, S3 object storage migration, and automated tax bracket optimization.
  - *Evidence Source:* [`SECURITY_AND_PRIVACY_FINDINGS.md`](file:///d:/MONVEX/docs/project-documentation/SECURITY_AND_PRIVACY_FINDINGS.md), [`DOCUMENTATION_GAP_REPORT.md`](file:///d:/MONVEX/docs/project-documentation/DOCUMENTATION_GAP_REPORT.md).

---

### CHAPTER 8: REFERENCES
* *Content:* Complete 20-entry canonical bibliography formatted in academic style.
* *Evidence Source:* [`REFERENCES_REGISTER.md`](file:///d:/MONVEX/docs/project-documentation/REFERENCES_REGISTER.md).
