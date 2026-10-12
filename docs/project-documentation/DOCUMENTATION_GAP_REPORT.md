# MONVEX Documentation Gap Report & Technical Traceability Audit

> **Dossier Document:** 15  
> **Source Verification Status:** `[V-SRC]` & `[V-TST]`  
> **Academic Chapter Mapping:** Cross-Chapter Traceability & Risk Assessment  

---

## 1. Executive Gap Analysis & Traceability Audit

This report documents every identified discrepancy, missing artifact, environment limitation, and academic anomaly discovered during the technical audit of MONVEX. By identifying these gaps transparently, the final academic documentation avoids unsupported claims, unverified features, or template penalties.

---

## 2. Identified Discrepancies & Resolutions

### Gap 01: Flutter Mobile Subsystem Status
* **Discrepancy:** The project context referenced an Android application built with Flutter.
* **Audit Finding:**
  - Physical check of directory `mobile/` revealed that it was deleted in the current local working tree.
  - Git history inspection (`git show HEAD:mobile/pubspec.yaml`) verified that a complete Flutter application (`monvex_mobile`, Flutter SDK `>=3.0.0 <4.0.0`, Provider state management, `fl_chart`, `local_auth` biometrics, `flutter_secure_storage`) was previously developed and tracked in commit history.
* **Academic Resolution:**
  The final report must accurately document the mobile subsystem as an architectural component developed in Git history but currently disabled/un-checked-out in the inspected active release branch. It must NOT be claimed as an actively running component alongside the live web application.
* **Status:** Resolved with explicit documentation.

---

### Gap 02: Live Cloud Deployment vs. Local Build Readiness
* **Discrepancy:** Prior discussions referenced production deployment to Render.
* **Audit Finding:**
  - Build scripts, standalone configurations, database migrations, and Blueprint files ([`render.yaml`](file:///d:/MONVEX/render.yaml)) are fully verified and passing (`[V-SRC]`, `[V-TST]`).
  - However, live deployment on the Render cloud platform requires operator account credentials and interactive input of live Neon PostgreSQL secrets.
* **Academic Resolution:**
  The report clearly distinguishes between **Code/Build Readiness (`PASS`)** and **Live Cloud Deployment (`PENDING OPERATOR ACTIONS`)**. The report documents the verified infrastructure-as-code and Docker builds rather than falsely claiming verified live cloud uptime.
* **Status:** Resolved with explicit status ledger.

---

### Gap 03: College Academic Template Inconsistencies
* **Discrepancy:** The prescribed syllabus template (`Format for Final Project Documentation Sem6.pdf`) contains two notable structural anomalies:
  1. **Chapter 6 Title:** Labeled `CHAPTER 6: SYSTEM DESIGN` even though it contains section `6.1 Test Reports` (Chapter 4 is also titled `SYSTEM DESIGN`).
  2. **Chapter 7 Numbering:** Sections `7.1.1 Significance (Advantages)`, `7.1.2 Limitations`, and `7.1.3 Future Scope` are nested under `7.1 Conclusion` without a corresponding `7.2`.
* **Academic Resolution:**
  In order to comply strictly with university evaluation rubrics while maintaining technical rigor:
  - Both sections are retained in their prescribed positions in the chapter evidence map.
  - Clear footnotes and student advisory notes are provided so the student can confirm whether their specific college department allows titling Chapter 6 as `TEST REPORTS AND RESULTS` or prefers strict adherence to the template text.
* **Status:** Documented and flagged for student confirmation.

---

### Gap 04: Third-Party Banking Integration (Open Banking / Plaid)
* **Discrepancy:** Some personal finance platforms claim automated live bank feed synchronization.
* **Audit Finding:**
  MONVEX currently implements transaction entry via manual forms, NLP natural language parsing, and multimodal receipt OCR ingestion. Live Open Banking APIs (such as Plaid or Yodlee) are not present in the codebase.
* **Academic Resolution:**
  Bank synchronization is strictly classified as **Chapter 7.1.3 Future Scope**. It is never represented as an active feature in Chapter 3 or 4.
* **Status:** Resolved; scope boundary enforced.

---

### Gap 05: Institutional Front Matter Placeholders
* **Discrepancy:** Student name, roll number, PRN, college name, guide details, and examination dates cannot be determined from code inspection.
* **Academic Resolution:**
  Comprehensive placeholders have been compiled in [`ACADEMIC_INFORMATION_CHECKLIST.md`](file:///d:/MONVEX/docs/project-documentation/ACADEMIC_INFORMATION_CHECKLIST.md). The student can fill these in seconds during final formatting.
* **Status:** Action assigned to student operator.

---

## 3. Risk Mitigation & Pre-Flight Review Matrix

| Risk ID | Identified Risk | Severity | Mitigation Strategy Implemented |
| :---: | :--- | :---: | :--- |
| **RSK-01**| Examiner queries missing Flutter mobile demo | Medium | Document that the mobile app architecture exists in Git history (`monvex_mobile`), while the primary production release focused on the responsive Web/Tauri platform. |
| **RSK-02**| Examiner checks for live Render hosting | Low | Present the verified Dockerfiles, `render.yaml` Blueprint, Gunicorn WSGI configs, and local test evidence. |
| **RSK-03**| Examiner questions financial precision | High | Point directly to `DecimalField(max_digits=12, decimal_places=2)` across all models, proving zero IEEE 754 floating-point errors. |
| **RSK-04**| Examiner checks for multi-tenant security leaks | High | Point to `tests/test_cyber_security.py` where cross-tenant IDOR attacks return HTTP 404. |
