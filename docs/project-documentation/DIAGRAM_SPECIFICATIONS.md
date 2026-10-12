# MONVEX Conceptual Models & Diagram Specifications

> **Dossier Document:** 07  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Chapter 3.6 (3.6.1 through 3.6.6)  

---

## 1. Overview of Required Conceptual Models

The college syllabus prescribed in `Format for Final Project Documentation Sem6.pdf` (Section 3.6) mandates six conceptual models:
1. **Data Flow Diagram (DFD):** Context Level (Level 0) and Functional Decomposition (Level 1).
2. **Entity-Relationship Diagram (ERD):** Complete schema representation with Crow's Foot notation.
3. **Class Diagram:** High-level object model showing models, services, and relationships.
4. **Use Case Diagram:** Actors, boundaries, and primary business use cases.
5. **Sequence Diagram:** Time-ordered message exchange for core transaction & AI workflow.
6. **System Flowchart:** Decision-tree and logical processing flow.

---

## 2. Model 1: Data Flow Diagram (DFD 3.6.1)

### 2.1 Level 0: Context-Level DFD
```
+------------------+                    Credentials / Transactions / Receipts                   +------------------+
|                  | ------------------------------------------------------------------------> |                  |
|                  | <------------------------------------------------------------------------ |                  |
|                  |                       Financial Insights / Charts / PDF Reports           |                  |
|                  |                                                                           |                  |
|                  |                     OAuth Identity Token / Authentication Callback         |      MONVEX      |
|   SYSTEM USER    | <======================================================================== |    FINANCIAL     |
|                  |                                                                           |   INTELLIGENCE   |
|                  |                     Multimodal Image Payload / Natural Language Prompts   |      SYSTEM      |
|                  | ------------------------------------------------------------------------> |                  |
|                  | <------------------------------------------------------------------------ |                  |
|                  |                       Structured Receipt OCR / AI Copilot Advice          |                  |
+------------------+                                                                           +------------------+
                                                                                                  |      ^
                                                             Structured JSON Context / Image Data |      | Inferred JSON
                                                                                                  v      |
                                                                                               +------------------+
                                                                                               |  GOOGLE GEMINI   |
                                                                                               |    AI ENGINE     |
                                                                                               +------------------+
```

### 2.2 Level 1: Functional Decomposition DFD
* **Process 1.0 (Identity & Access Management):** Ingests credentials; validates against `D1: User Store`; outputs JWT access & refresh tokens.
* **Process 2.0 (Transaction Ingestion & ML Categorization):** Ingests manual, NLP, or receipt entries; invokes `FinancialCategorizer`; stores in `D2: Transaction Ledger`.
* **Process 3.0 (Budgeting & Milestone Enforcement):** Reads `D2: Transaction Ledger` and `D3: Budget Store`; calculates consumed percentage; issues notifications to `D4: Alert Store`.
* **Process 4.0 (Financial Analytics & Health Scoring):** Ingests historical transactions, asset valuations (`D5: Net Worth Store`); executes 4-pillar health score algorithm; outputs score (0–100) and forecast runway.
* **Process 5.0 (AI Copilot & Conversational Reasoning):** Retrieves isolated context from `D2`, `D3`, `D5`; invokes Google Gemini API; returns contextual financial advice; stores conversation in `D6: AI Session Store`.
* **Process 6.0 (PDF Statement & Export Service):** Aggregates period records from `D2` and `D3`; streams binary ReportLab PDF document to user.

---

## 3. Model 2: Entity-Relationship Diagram (ERD 3.6.2)

```mermaid
erDiagram
    User ||--|| Profile : "has profile"
    User ||--o{ GoogleIdentity : "authenticates via"
    User ||--o{ Category : "defines custom"
    User ||--o{ Transaction : "owns ledger records"
    User ||--o{ Budget : "establishes limits"
    User ||--o{ SavingsGoal : "sets targets"
    User ||--o{ Asset : "holds wealth"
    User ||--o{ Liability : "owes debt"
    User ||--o{ Receipt : "uploads"
    User ||--o{ Notification : "receives"
    User ||--o{ ConversationSession : "conducts"
    User ||--o{ SecurityAuditLog : "generates audit"

    Category ||--o{ Transaction : "categorizes"
    Category ||--o{ Budget : "budgeted under"
    Category ||--o{ RecurringPayment : "classified as"

    Merchant ||--o{ Transaction : "transacts with"
    Merchant ||--o{ RecurringPayment : "bills through"

    SavingsGoal ||--o{ GoalContribution : "receives contributions"
    ConversationSession ||--o{ ConversationMessage : "contains turns"
    Receipt |o--o| Transaction : "confirmed into"
    Transaction ||--o{ AnomalyEvent : "flags outliers"

    User {
        int id PK
        string username
        string email
        string password
    }

    Profile {
        uuid id PK
        int user_id FK
        decimal monthly_income
        decimal savings_target_percentage
        string currency
        string theme
        string mfa_secret
        boolean is_mfa_enabled
    }

    Transaction {
        uuid id PK
        int user_id FK
        uuid category_id FK
        uuid merchant_id FK
        decimal amount
        string type
        date date
        string description
        string source
        decimal confidence
    }

    Budget {
        uuid id PK
        int user_id FK
        uuid category_id FK
        decimal limit_amount
        string period
        boolean is_active
    }

    SavingsGoal {
        uuid id PK
        int user_id FK
        string title
        decimal target_amount
        decimal current_amount
        date deadline
        string status
    }

    Asset {
        uuid id PK
        int user_id FK
        string name
        string asset_type
        decimal value
    }

    Liability {
        uuid id PK
        int user_id FK
        string name
        string liability_type
        decimal remaining_balance
        decimal interest_rate_pct
        decimal monthly_emi
    }

    Receipt {
        uuid id PK
        int user_id FK
        string merchant_name
        decimal total_amount
        string status
        json items
    }
```

---

## 4. Model 3: System Class Diagram (3.6.3)

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +set_password(raw_password)
        +check_password(raw_password)
    }

    class Transaction {
        +UUID id
        +Decimal amount
        +string type
        +Date date
        +string description
        +string source
        +Decimal confidence
        +save()
    }

    class FinanceService {
        +get_dashboard_metrics(user) Dict
        +calculate_financial_health_score(user) Dict
        +calculate_category_breakdown(user, start, end) List
    }

    class ForecastService {
        +forecast_cash_flow(user, days) Dict
        +project_runway(user) Int
    }

    class FinancialCategorizer {
        -_instance FinancialCategorizer
        -Pipeline pipeline
        +predict(text, merchant_name) Dict
        -_clean_text(text) String
    }

    class AICopilotService {
        +process_chat(user, message, session_id) Dict
        +run_what_if_simulation(user, scenario) Dict
        -_build_user_financial_context(user) Dict
    }

    class OCRService {
        +extract_receipt_data(image_bytes) Dict
        -_parse_gemini_response(response_text) Dict
    }

    class FileValidationService {
        +validate_uploaded_file(file) Boolean
        +check_magic_bytes(file_header) String
    }

    class PDFReportService {
        +generate_monthly_statement(user, year, month) BytesIO
    }

    User "1" --> "*" Transaction : owns
    FinanceService ..> Transaction : aggregates
    FinanceService ..> User : evaluates
    FinancialCategorizer ..> Transaction : predicts category
    AICopilotService ..> FinanceService : queries context
    OCRService ..> FileValidationService : sanitizes
```

---

## 5. Model 4: System Use Case Diagram (3.6.4)

```mermaid
flowchart LR
    User((Authenticated User))
    Visitor((Unauthenticated Visitor))
    Gemini((Google Gemini AI))
    DB[(Neon Database)]

    subgraph MONVEX System Boundary
        UC1([Register Account / Login])
        UC2([Enable Multi-Factor Auth])
        UC3([Record Financial Transaction])
        UC4([Upload & OCR Scan Receipt])
        UC5([Create Category Budget])
        UC6([Track Savings Goals])
        UC7([View 360 Health Score])
        UC8([Simulate Cashflow Runway])
        UC9([Consult AI Copilot])
        UC10([Export Monthly PDF Statement])
        UC11([Manage Assets & Liabilities])
        UC12([View Public Legal Pages])
    end

    Visitor --> UC1
    Visitor --> UC12

    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11

    UC4 -.-> Gemini
    UC9 -.-> Gemini
    UC3 --> DB
    UC5 --> DB
    UC7 --> DB
```

---

## 6. Model 5: System Sequence Diagram (3.6.5)

### Traced Scenario: Multimodal Receipt Upload, OCR, & Automatic Ledger Conversion
```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser (Next.js)
    participant API as Transaction API (/receipts/)
    participant Security as FileValidationService
    participant Gemini as Google Gemini 2.0 API
    participant ML as FinancialCategorizer
    participant DB as Neon PostgreSQL

    User->>API: POST /receipts/upload/ (Receipt Image)
    API->>Security: validate_uploaded_file(image)
    Security-->>API: Magic Bytes Valid (image/jpeg)
    API->>Gemini: generate_content(ImageBytes + Prompt)
    Gemini-->>API: JSON {merchant: "Starbucks", total: 450.00, date: "2026-10-12"}
    API->>ML: predict("Starbucks Coffee")
    ML-->>API: Category: "Food & Dining", Confidence: 0.98
    API->>DB: INSERT INTO Receipt (status="PENDING_REVIEW")
    DB-->>API: Receipt Record Saved
    API-->>User: 201 Created (Staged Receipt Preview)
    
    User->>API: POST /receipts/{id}/confirm/
    API->>DB: INSERT INTO Transaction (amount=450.00, category="Food & Dining")
    API->>DB: UPDATE Receipt SET status="CONFIRMED"
    DB-->>API: Commit Transaction
    API-->>User: 200 OK (Transaction Recorded in Ledger)
```

---

## 7. Model 6: System Flowchart (3.6.6)

```mermaid
flowchart TD
    Start([User Initiates Financial Transaction Entry]) --> Choice{Entry Method?}
    
    Choice -->|Manual Form| InputData[Input Amount, Date, Category, Description]
    Choice -->|Natural Language| NLPInput[Enter Text: e.g. 'Spent 600 on fuel']
    Choice -->|Receipt Photo| UploadImage[Upload Image File]

    NLPInput --> RunNLP[NLP Parser Extracts Entities]
    RunNLP --> MLPredict

    UploadImage --> ValMagic{Valid Magic Bytes?}
    ValMagic -->|No| RejectFile[Return 400 Bad Request: Invalid File Format] --> End([Terminated])
    ValMagic -->|Yes| CallGemini[Google Gemini Multimodal OCR Extraction]
    CallGemini --> StagedReceipt[Save Receipt Status: PENDING_REVIEW]
    StagedReceipt --> UserConfirm{User Confirms?}
    UserConfirm -->|No| DiscardReceipt[Status: REJECTED] --> End
    UserConfirm -->|Yes| ExtractReceiptData[Extract Amount & Merchant] --> MLPredict

    InputData --> HasCat{Category Specified?}
    HasCat -->|Yes| SaveLedger[Validate Decimal Amount & Save Transaction]
    HasCat -->|No| MLPredict[Invoke ML Categorizer TF-IDF + Naive Bayes]

    MLPredict --> AssignCat[Assign Category & Confidence Score]
    AssignCat --> SaveLedger

    SaveLedger --> CheckBudget{Budget Exceeded?}
    CheckBudget -->|Yes| Alert[Generate Notification: BUDGET_WARNING] --> UpdateMetrics[Recalculate Health Score & Net Worth]
    CheckBudget -->|No| UpdateMetrics

    UpdateMetrics --> Complete([Transaction Successfully Recorded in Ledger])
```
