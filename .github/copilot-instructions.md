<!-- .github/copilot-instructions.md -->
# Copilot / Agent Guidance — escfinan

## Purpose
Quickly onboard an AI coding agent to this repository: what matters, where to change AI behavior, and how the pieces fit together.

## Big Picture Architecture
- **Frontend**: Vite + React 18 + TypeScript. Source is under `src/` (components, hooks, pages, integrations)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS) — all UI components are in `src/components/ui/`
- **State Management**: React Query (@tanstack/react-query) for server state, React hooks for local state
- **Data & Backend**: Supabase (PostgreSQL + RLS + Edge Functions). No separate Express server
- **Routing**: React Router v6 with permission-based route protection (`PermissionProtectedRoute`)
- **Forms**: React Hook Form + Zod for validation
- **Styling**: Tailwind CSS with CSS variables for theming

## System Domain
This is a **financial management system (ERP-like)** with:
- Income/expense tracking, bank reconciliation, credit card management
- Cash flow forecasting and financial dashboards
- Client/supplier/employee/product/service management
- Task management with labels, assignments, and deadlines
- Time tracking system with approval workflow (clock in/out, hour bank, edit requests)
- Quote and sales order management
- Public billing pages (no auth required)
- **CRM module**: Lead pipeline management with stages, activities tracking, source attribution
- **Project management**: Project tracking with tasks, time entries, expenses, and profitability analysis
- **Inventory/stock management**: Product tracking, stock movements, and inventory control

Language: All UI text and AI responses are in **Brazilian Portuguese (pt-BR)**.

## Key Files & Patterns

### Entry & Configuration
- `src/main.tsx` — App entry point, renders `<App />` with React.StrictMode
- `src/App.tsx` — Sets up QueryClientProvider, router, and all routes with permission checks
- `tsconfig.json` — Path alias `@/*` → `src/*` (use throughout: `import X from '@/components/Y'`)
- `vite.config.ts` — Dev server on port 8080, proxy `/api` to external API, uses `@vitejs/plugin-react-swc`
- `components.json` — shadcn/ui config (aliases for `@/components`, `@/hooks`, `@/lib/utils`)

### State & Data Patterns
- **React Query setup**: Global QueryClient in `App.tsx` with 5-min staleTime, retry: 1
- **Custom hooks**: All data fetching/mutations are in `src/hooks/use*.tsx` (e.g., `useTransactions`, `useAuth`, `useBankAccounts`)
  - Use `useQuery` for reads, `useMutation` for writes
  - After mutations, invalidate related queries: `queryClient.invalidateQueries({ queryKey: ['transactions'] })`
- **Supabase client**: Import from `@/integrations/supabase/client` (auto-generated, uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`)
- **Auth**: `useAuth` hook provides `{ user, session, loading, signOut }` — wraps Supabase auth state listener

### Component Patterns
- **Layout**: All authenticated pages wrapped in `<Layout>` (see `App.tsx` routes)
  - `Layout` → contains `Sidebar`, `Header`, main content area
- **Dialogs**: Dialog-based forms for create/edit (e.g., `TransactionDialog`, `ClientDialog`, `TaskDialog`)
  - Use shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`
  - Forms use React Hook Form + Zod schemas
- **Quick-add components**: Prefix `Quick*Dialog.tsx` (e.g., `QuickClientDialog`) — simplified creation flows
- **Permission checks**: Wrap routes with `PermissionProtectedRoute` passing `permission` prop (e.g., `can_view_receivables`)
  - Permissions come from `user_permissions` table in Supabase (checked via `useUserPermissions` hook)
- **Toasts**: Use `sonner` (`<Sonner />` in App.tsx) — call `toast.success()`, `toast.error()` from `sonner` package
- **Dynamic imports**: Heavy/optional services use `await import('...')` pattern (see `AIAssistant.tsx`) to reduce bundle size

### AI Integration
1. **UI**: `src/components/AIAssistant.tsx` — chat widget with quick-action patterns
2. **Service**: `src/api/aiAssistantService.ts` — builds message arrays, calls `supabase.functions.invoke('chat', { body: { messages, systemData } })`
3. **Edge Function**: `supabase/functions/chat/index.ts` — assembles system prompt (includes financial context like balance, expenses), forwards to Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
   - **Model**: Currently `google/gemini-2.5-flash`
   - **System prompt**: Enforces Brazilian Portuguese, provides financial context from `systemData`
   - **Error handling**: Returns HTTP 429 (rate limit), 402 (no credits), or 500 (generic errors)

**To modify AI behavior**: Edit `supabase/functions/chat/index.ts` (change model, system prompt, or response parsing)

### Supabase Edge Functions
Located in `supabase/functions/`:
- `chat/` — AI assistant (requires `LOVABLE_API_KEY` env var)
- `create-user/`, `check-due-transactions/`, `process-recurring-bills/`, `send-whatsapp/`, `sync-credit-card/` — background jobs/triggers

**Deploy**: `supabase functions deploy <function-name>` (requires Supabase CLI)

### Database & Migrations
- Migrations in `supabase/migrations/*.sql`
- Key tables: `transactions`, `bank_accounts`, `credit_cards`, `clients`, `suppliers`, `tasks`, `time_tracking`, `time_clock_requests`, `time_clock_summary`, `user_permissions`, `leads`, `lead_activities`, `projects`, `project_tasks`, `products`, `stock_movements`
- **RLS (Row Level Security)**: Enabled on all tables — users only see their own data or data they have permission to access
- **Multi-tenancy**: Tables use `owner_user_id` (admin) and `user_id` (sub-user) pattern
  - Helper functions: `get_effective_user_id()`, `can_access_user_data(user_id)` in migrations
- **Time tracking workflow**: `time_tracking` → edit request via `time_clock_requests` → approval by manager → updates `time_clock_summary`

## Development Workflow

### Start Development Server
```bash
npm install
npm run dev  # Vite dev server on http://0.0.0.0:8080
```

### Build & Preview
```bash
npm run build        # Production build
npm run build:dev    # Dev mode build
npm run preview      # Preview production build
```

### Lint
```bash
npm run lint  # ESLint with React plugins
```

### Environment Variables (Frontend)
Create `.env` or `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Supabase Edge Function Environment
Set in Supabase dashboard or CLI:
```
LOVABLE_API_KEY=your-lovable-api-key
```

### Testing Locally
- Run frontend: `npm run dev`
- (Optional) Serve functions locally: `supabase functions serve <function-name>`
- Access app at `http://localhost:8080` or Codespaces forwarded port

## Project-Specific Conventions

### Import Patterns
- **Always use `@/` alias**: `import { Button } from '@/components/ui/button'`
- **Supabase client**: `import { supabase } from '@/integrations/supabase/client'`
- **Hooks**: `import { useTransactions } from '@/hooks/useTransactions'`

### Component Structure
```tsx
// Typical page structure
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const MyPage = () => {
  // 1. Hooks (auth, data fetching)
  const { user } = useAuth();
  const { data, isLoading } = useMyData();
  
  // 2. Local state & handlers
  const [open, setOpen] = useState(false);
  
  // 3. Render
  return <div>...</div>;
};
```

### Form Patterns
```tsx
// React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  amount: z.number().positive(),
});

const MyForm = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", amount: 0 },
  });
  
  const onSubmit = (data) => {
    // mutation logic
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
};
```

### Query Invalidation
After mutations, invalidate related queries to refetch data:
```tsx
const queryClient = useQueryClient();
await someMutation();
queryClient.invalidateQueries({ queryKey: ['transactions'] });
queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
```

### Permission Checks
Routes use `PermissionProtectedRoute`:
```tsx
<Route path="/receitas" element={
  <PermissionProtectedRoute permission="can_view_receivables">
    <Layout><Receitas /></Layout>
  </PermissionProtectedRoute>
} />
```

Permissions are defined in `user_permissions` table and checked server-side via RLS.

## Common Tasks

### Add New Page
1. Create `src/pages/MyNewPage.tsx`
2. Add route in `src/App.tsx` (wrap in `ProtectedRoute` or `PermissionProtectedRoute`)
3. Add nav link in `src/components/Sidebar.tsx` or `src/components/NavLink.tsx`

### Add New Dialog/Modal
1. Create `src/components/MyDialog.tsx` using shadcn `Dialog` primitives
2. Use React Hook Form for forms, `useMutation` for save actions
3. Pass `open`/`onOpenChange` props for control

### Add New Data Hook
1. Create `src/hooks/useMyData.tsx`
2. Use `useQuery` for fetching, `useMutation` for writes
3. Export hook and use in components

### Add New Feature Module
Key modules follow patterns found in:
- **CRM**: `pages/CRM.tsx`, `hooks/useLeads.tsx`, `hooks/useLeadActivities.tsx`, `components/LeadDialog.tsx`
- **Projects**: `pages/Projects.tsx`, `hooks/useProjects.tsx`, `hooks/useProjectTasks.tsx`, `components/ProjectCard.tsx`
- **Time Tracking**: `pages/Ponto.tsx`, `hooks/useTimeTracking.ts`, `components/TimeClockApprovalPanel.tsx`
- **Inventory**: `pages/estoque/`, `hooks/useProducts.tsx`

Follow established patterns for CRUD operations, dialogs, and permission checks.

### Modify AI System Prompt
Edit `supabase/functions/chat/index.ts` → update `systemPrompt` variable (keep Brazilian Portuguese requirement)

### Deploy Edge Function
```bash
supabase functions deploy chat  # or other function name
```

## Documentation Files
- `SISTEMA_DE_PONTO_COMPLETO.md` — Complete time tracking system implementation guide
- `GUIA_RAPIDO_PONTO.md` — Quick guide for time clock feature
- `BACKEND_AI_SETUP.md` — AI assistant setup notes
- `DEVICE_TESTING_GUIDE.md` — Testing on different devices
- Other `*.md` files — Migration notes, error fixes, setup guides

## Notes for Agents
- **Prefer surgical edits**: Don't refactor entire files unless necessary
- **Preserve Portuguese**: All user-facing text in Brazilian Portuguese
- **Check permissions**: Verify user permissions before showing UI or allowing actions
- **Test queries**: After data mutations, ensure related queries are invalidated
- **Use existing patterns**: Follow component/hook patterns already established (see `src/components/` and `src/hooks/`)
- **shadcn/ui**: Use existing UI components from `src/components/ui/` — don't reinvent primitives
- **Environment vars**: Frontend uses `VITE_*` prefix; edge functions use plain env vars

## Key Dependencies
- `@supabase/supabase-js` — Supabase client
- `@tanstack/react-query` — Server state management
- `react-router-dom` — Routing
- `react-hook-form` + `zod` — Forms & validation
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `recharts` — Charts/graphs
- `date-fns` — Date utilities
- `xlsx` — Excel import/export

---
**Last Updated**: 2025-12-11  
For questions or clarifications, inspect the specific files mentioned or search the codebase.
