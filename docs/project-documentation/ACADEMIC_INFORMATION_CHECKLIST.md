# MONVEX Academic Front Matter & Information Checklist

> **Dossier Document:** 14  
> **Source Verification Status:** `[V-CFG]`  
> **Academic Chapter Mapping:** Front Matter (Proforma, Certificates, Declarations)  

---

## 1. Academic Information Integrity Rules

In strict adherence to academic ethics and the instructions of this technical audit:
* **Zero Invention of Personal Data:** Student names, seat numbers, PNR numbers, faculty names, college titles, signatures, and approval stamps are **NEVER fabricated or guessed**.
* **Explicit Placeholders:** Every required administrative data point is documented below as a structured placeholder for the student to supply prior to final report printing.

---

## 2. Institutional Details & Placeholder Registry

| Field # | Required Academic Field | Current Dossier Status | Placeholder Value to Fill |
| :---: | :--- | :---: | :--- |
| **AC-01** | **Candidate / Student Name** | `[PLACEHOLDER]` | `[STUDENT_FULL_NAME]` |
| **AC-02** | **Candidate Seat / Roll Number** | `[PLACEHOLDER]` | `[STUDENT_SEAT_NUMBER]` |
| **AC-03** | **Permanent Registration Number (PRN / PNR)** | `[PLACEHOLDER]` | `[STUDENT_PRN_NUMBER]` |
| **AC-04** | **College / Institution Name** | `[PLACEHOLDER]` | `[COLLEGE_FULL_NAME]` |
| **AC-05** | **College Department** | `[PLACEHOLDER]` | `Department of Computer Science` |
| **AC-06** | **Degree & Semester** | **VERIFIED** | `Bachelor of Science in Computer Science (B.Sc. CS) — Semester VI` |
| **AC-07** | **Affiliated University** | `[PLACEHOLDER]` | `[UNIVERSITY_NAME, e.g., University of Mumbai]` |
| **AC-08** | **Academic Year** | **VERIFIED** | `2025 – 2026` |
| **AC-09** | **Project Guide Name** | `[PLACEHOLDER]` | `Prof. [GUIDE_FULL_NAME]` |
| **AC-10** | **Project Guide Designation** | `[PLACEHOLDER]` | `[GUIDE_DESIGNATION, e.g., Assistant Professor / Head of CS]` |
| **AC-11** | **Guide Teaching Experience** | `[PLACEHOLDER]` | `[GUIDE_YEARS_EXPERIENCE] Years` |
| **AC-12** | **Head of Department (HOD) Name**| `[PLACEHOLDER]` | `Prof. [HOD_FULL_NAME]` |
| **AC-13** | **Principal Name** | `[PLACEHOLDER]` | `Dr. [PRINCIPAL_FULL_NAME]` |
| **AC-14** | **External Examiner Name** | `[PLACEHOLDER]` | `[EXTERNAL_EXAMINER_NAME]` (Provided on Exam Day) |
| **AC-15** | **Project Submission Date** | `[PLACEHOLDER]` | `[SUBMISSION_DATE, e.g., April 2026]` |
| **AC-16** | **College Emblem / Seal Image** | `[PLACEHOLDER]` | `[PATH_TO_COLLEGE_LOGO_IMAGE]` |
| **AC-17** | **Company / Industry Sponsorship**| **VERIFIED** | `N/A — Independent Academic Capstone Project` |

---

## 3. Prescribed Front Matter Template Text

The following boilerplate text conforms to the college's prescribed academic format:

### 3.1 Project Proposal Approval Proforma
```
PROFORMA FOR THE APPROVAL OF PROJECT PROPOSAL

1. Name of the Student:       [STUDENT_FULL_NAME]
2. Roll No. / Seat No.:       [STUDENT_SEAT_NUMBER]
3. Title of the Project:      MONVEX: AI-Powered Personal Financial Intelligence System
4. Area of the Project:       Full-Stack Web Development, Financial Data Engineering,
                              Machine Learning & Generative Artificial Intelligence
5. Name of the Guide:         Prof. [GUIDE_FULL_NAME]
6. Designation of the Guide:  [GUIDE_DESIGNATION]
7. Educational Qualification: [GUIDE_QUALIFICATIONS]
8. Teaching Experience:       [GUIDE_YEARS_EXPERIENCE] Years

Approved / Not Approved:      [SIGNATURE OF GUIDE]
Date:                         [APPROVAL_DATE]
```

### 3.2 Certificate of Authenticity
```
CERTIFICATE OF AUTHENTICITY

This is to certify that the project entitled "MONVEX: AI-Powered Personal Financial 
Intelligence System" is a bonafide work carried out by [STUDENT_FULL_NAME] (Roll No: 
[STUDENT_SEAT_NUMBER]) in partial fulfillment of the requirements for the award of 
the degree of Bachelor of Science in Computer Science (Semester VI) affiliated with 
[UNIVERSITY_NAME] during the academic year 2025–2026.


________________________                                ________________________
   Internal Guide                                          Head of Department
Prof. [GUIDE_FULL_NAME]                                   Prof. [HOD_FULL_NAME]


________________________                                ________________________
   External Examiner                                           Principal
                                                         Dr. [PRINCIPAL_FULL_NAME]
```

### 3.3 Candidate Declaration
```
DECLARATION

I, [STUDENT_FULL_NAME], hereby declare that the project entitled "MONVEX: AI-Powered 
Personal Financial Intelligence System", submitted in partial fulfillment of the 
requirements for the Degree of Bachelor of Science in Computer Science to [COLLEGE_NAME], 
is the result of original work done by me under the supervision and guidance of Prof. 
[GUIDE_FULL_NAME].

I further declare that this project work or any part thereof has not been previously 
submitted for the award of any degree, diploma, or title in this or any other university.


Date:  [SUBMISSION_DATE]
Place: [COLLEGE_LOCATION]                              ________________________
                                                         [STUDENT_FULL_NAME]
```

---

## 4. Academic Abstract (Pre-Composed Factual Summary)

> **ABSTRACT**
>
> In contemporary personal finance, individuals struggle with fragmented accounts, tedious manual transaction entry, and an absence of predictive guidance. Traditional budgeting applications passively log expenses without explaining variance or modeling forward-looking scenarios.
>
> This project presents **MONVEX**, an AI-powered personal financial intelligence system engineered to automate transaction tracking, calculate objective financial health, and deliver conversational decision support. MONVEX implements a decoupled multi-tier architecture combining a **Next.js 14** web application (React 18, TypeScript, Tailwind CSS, TanStack Query) with a high-performance **Django 5.2 REST Framework** backend and a **Neon Serverless PostgreSQL 16** persistence tier.
>
> Key innovations include: (1) a **Scikit-learn** TF-IDF Multinomial Naive Bayes classifier that automatically categorizes transactions with high confidence; (2) a multimodal **Google Gemini 2.0** pipeline that parses paper receipts into structured ledger records with binary magic-byte validation; (3) an algorithmic 360-degree Financial Health Score (0–100) evaluating savings rate, budget discipline, debt burden, and emergency runway; and (4) an interactive conversational financial copilot providing multi-turn advisory insights and "What-If" scenario simulations.
>
> The system has been validated across 180 passing automated backend unit/integration tests, 24 end-to-end Playwright route navigation tests, and responsive layout audits across desktop and mobile form factors. MONVEX establishes an accessible, secure, and privacy-conscious framework for modern personal financial management.
