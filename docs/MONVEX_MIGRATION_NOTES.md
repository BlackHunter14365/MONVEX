# MONVEX — Developer Migration Notes & Operational Runbook

> **Document Type:** Developer Migration Reference & Runbook  
> **Date:** August 25, 2026

---

## 1. New Web Architecture Standards

### A. Data Fetching (TanStack Query v5)
When building new pages or components, do **NOT** use `useEffect + fetch + useState`.
Use the centralized typed query hooks in `@/hooks/queries/`:

```typescript
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';

export function MyComponent() {
  const { data, isLoading, error, refetch } = useDashboardQuery();
  // Server state is automatically cached and synchronized
}
```

### B. Form Validation (React Hook Form + Zod)
When building forms, import schemas from `@/lib/validation/schemas`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, TransactionInput } from '@/lib/validation/schemas';

export function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
  });

  const onSubmit = (data: TransactionInput) => {
    // 100% type-safe data
  };
}
```

### C. Client-Only State (Zustand)
For global UI state (modals, drawer, active workspace preferences), use `@/lib/store/uiStore`:

```typescript
import { useUIStore } from '@/lib/store/uiStore';

export function Navigation() {
  const isDrawerOpen = useUIStore((state) => state.isMobileDrawerOpen);
  const toggleDrawer = useUIStore((state) => state.toggleMobileDrawer);
}
```

---

## 2. Verification Commands

| Command | Working Directory | Purpose |
| :--- | :--- | :--- |
| `npx tsc --noEmit` | `web/` | Validate TypeScript types |
| `npm run build` | `web/` | Compile Next.js production build |
| `python manage.py test` | `backend/` | Execute all 66 Django backend unit & integration tests |
| `flutter analyze` | `mobile/` | Validate Flutter static analysis |
| `npx tauri build` | `desktop/` | Build Windows NSIS desktop installer |

---

## 3. Production Safety Runbook

1. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` defaults to `https://monvex-backend.onrender.com/api/v1`.
   - `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL` points to the active GitHub release.
2. **Desktop External URL**:
   - Tauri desktop production executable loads `https://monvex-web.onrender.com`.
3. **Android Release**:
   - Mobile APK release remains frozen in closed preview.
