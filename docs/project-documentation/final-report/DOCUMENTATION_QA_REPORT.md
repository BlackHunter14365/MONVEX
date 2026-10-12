# MONVEX Final Documentation — QA Report

## Deliverables

- Editable report: `MONVEX_Final_Project_Documentation.docx`
- Word-rendered preview: `MONVEX_Final_Project_Documentation.pdf`
- Reproducible generation source: `build_report.py`
- Source-to-report matrix: `SOURCE_TRACEABILITY_MATRIX.md`
- Student completion items: `FINAL_PLACEHOLDER_CHECKLIST.md`
- Seven report diagrams: `assets/diagrams/`
- Seventeen copied registered screenshots: `assets/screenshots/`

The cover, proposal proforma, certificate, declaration, acknowledgement, and document metadata include the details visible on the student-provided ID card: ANSARI DANISH ASLAM, TYCS A, College Roll No. 6, Student ID 5072732, the printed college name/address, and academic year 2026–2027. DOB and blood group were not included.

Following the supplied college format PDF, the report now uses one-inch margins, Times New Roman 12 pt body text, 1.5 line spacing, justified body paragraphs with a half-inch first-line indent, and centered front-matter headings. The supplied college logo is placed on the cover and certificate. A pre-format copy of the saved report is retained at `assets/branding/MONVEX_before_formatting.docx`.

## Chapter and subsection coverage

- Front matter: cover, proposal proforma, certificate, declaration, acknowledgement, abstract, field-based Table of Contents, List of Figures, List of Tables, abbreviations.
- Chapter 1: 1.1–1.5, including 1.3.1–1.3.3.
- Chapter 2: frontend, backend, database, ML, generative AI/OCR, desktop, reporting, testing, deployment and security technologies.
- Chapter 3: 3.1–3.6, including 3.6.1–3.6.6 conceptual-model subsections.
- Chapter 4: 4.1 modules and architecture/API groups; 4.2 data design; 4.2.1 integrity constraints; 4.3 screenshots.
- Chapter 5: 5.1, 5.1.1, 5.1.1.1, 5.1.1.2, 5.2, 5.2.1, 5.2.2.
- Chapter 6: supplied title “SYSTEM DESIGN”; 6.1 Test Reports.
- Chapter 7: supplied hierarchy 7.1, 7.1.1, 7.1.2, 7.1.3.
- Chapter 8: twenty references.

## Diagram and screenshot inventory

Seven diagrams are included: DFD Level 0, DFD Level 1, ERD, class diagram, use case diagram, sequence diagram, and system flowchart. They are generated from the included Python source and inserted as high-resolution PNGs.

All 33 paths in the screenshot register were checked: 21 image files exist and were visually inspected in a contact sheet; 12 listed paths under `artifacts/` are missing. Seventeen existing files were copied to the output asset folder, and nine are inserted as report figures. The selected files cover the landing page, login, dashboard, transactions, AI copilot, budgets, goals, receipts, analytics, forecast, net worth, debt, reports, security, and three mobile screens. They show mainly empty/demo states with zero-value summaries. The dossier describes the data as synthetic; no visible secrets or personal financial records were found in the reviewed captures.

## Claims reconciled

- No active Render deployment or production database was independently observed; deployment files are presented as configuration only.
- Flutter code is reachable in Git history but absent from the active working tree.
- Open Banking is future scope.
- Test arithmetic is consistent: 72 + 108 + 24 + 28 + 1 + 1 = 234. The categories distinguish backend unit tests, integration tests, E2E routes, viewport checks, a security configuration check, and a frontend build.
- Test outcomes are marked dossier-reported because raw full-suite logs were not found and the suites were not rerun during report generation.
- Frontend versions use lockfile-resolved versions where available; Python package requirements are ranges and are not presented as exact installed versions.
- Django's default User uses an integer key; business models commonly use UUIDs.
- The active TOTP secret model field is a plain CharField; encryption at rest was not evidenced.
- The transaction model is documented as a single-entry ledger, not a double-entry accounting system.
- The proposed schedule uses relative weeks because the dossier's dated plan conflicts with its inspection date.
- Student name, TYCS A class, college roll number 6, Student ID 5072732, college name/address, and academic year 2026–2027 were transcribed from the supplied ID card. DOB and blood group were omitted.

## Formatting and rendering checks

- Generated and reopened the `.docx` with `python-docx`; the file is a valid Office Open XML package.
- After the template-format update, rechecked DOCX ZIP integrity and extracted text against the pre-format backup. All non-TOC report wording matches; automatic contents/list page references updated to the new pagination. The refreshed preview is 52 pages with 19 embedded images, including the two college logos.
- Confirmed Word Heading styles, captions, section content, embedded images, and field codes are present.
- Opened the document through installed Microsoft Word automation, refreshed the Table of Contents and both caption-based lists, saved the document, and exported a PDF preview.
- After applying the template layout, the cover fits on one page with the academic-year line present; the supplied logo is legible on both the cover and certificate. The proforma and certificate remain on the following pages, and the test matrix spans pages 46–47 with repeated headers.
- PDFium rendered the final preview for contact-sheet inspection. The final cover, proforma, certificate, declaration, contents/lists, chapter openings, diagrams, screenshot pages, test tables, and references were sampled.
- The final preview contains 52 pages. No empty pages were detected; chapter title pages are intentional. Contents and figure/table lists have populated page references. The sampled tables fit within the margins; no major clipping, overlapping text, or broken images were seen.
- The report remains editable in Word. Fields are set to update on open; if a Word-compatible editor does not refresh automatically, select the contents/lists and choose Update Field.

## Remaining placeholders and academic decisions

See `FINAL_PLACEHOLDER_CHECKLIST.md`. Remaining fields include university name, university seat number, PRN/PNR, guide/HOD/principal names and credentials, external examiner, approval/submission dates, signatures, and seal. The supplied template calls Chapter 6 “SYSTEM DESIGN” even though it contains test reports, and nests Chapter 7 sections under 7.1. Those anomalies are retained pending guide confirmation.

## Verification limitations

- This report generation did not rerun the application test suites, frontend build, live provider flows, production security check, or deployment.
- The 17 selected screenshots are repository artifacts; their synthetic-data provenance comes from the dossier and was not recreated in a new live session.
- Twelve core reference pages were opened during QA, including official framework documentation, the scikit-learn paper, and IETF RFC 7519/6238. The OWASP reference was updated to its current canonical URL. The remaining bibliography URLs were not each independently checked.
- The installed Microsoft Word automation and PDF preview were used for rendering; this does not establish that every external Word version or printer setup will paginate identically.

## Exact outputs

- `D:\MONVEX\docs\project-documentation\final-report\MONVEX_Final_Project_Documentation.docx`
- `D:\MONVEX\docs\project-documentation\final-report\MONVEX_Final_Project_Documentation.pdf`
- `D:\MONVEX\docs\project-documentation\final-report\SOURCE_TRACEABILITY_MATRIX.md`
- `D:\MONVEX\docs\project-documentation\final-report\FINAL_PLACEHOLDER_CHECKLIST.md`
- `D:\MONVEX\docs\project-documentation\final-report\DOCUMENTATION_QA_REPORT.md`
- `D:\MONVEX\docs\project-documentation\final-report\assets\branding\college_logo.png`
- `D:\MONVEX\docs\project-documentation\final-report\assets\branding\MONVEX_before_formatting.docx`

