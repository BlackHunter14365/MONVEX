# MONVEX 2.0 Automated Testing Strategy

## 1. Test Suite Coverage
MONVEX 2.0 maintains a 100% passing automated test suite covering:
- Deterministic Financial Math & Scenario Simulators
- Zero-Tenant Multi-User Isolation
- Receipt OCR Entity Extraction & Confirmation Lifecycle
- Net Worth & Loan Amortization Calculations
- Web Application Firewall & Cyber Defense Interception
- JWT Authentication & Verification Workflows

---

## 2. Running Automated Tests

### Backend Unit & Integration Tests:
```powershell
cd d:\MONVEX\backend
& ".\.venv\Scripts\python.exe" manage.py test tests
```
*Current status: 58/58 tests passing.*

### Frontend TypeScript Verification:
```powershell
cd d:\MONVEX\web
npx tsc --noEmit
```
*Current status: 0 type errors.*
