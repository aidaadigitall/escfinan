<!-- .github/copilot-instructions.md -->
# Copilot / Agent Guidance — escfinan

Purpose
- Quickly onboard an AI coding agent to this repository: what matters, where to change AI behavior, and how the pieces fit together.

Big picture
- Frontend: Vite + React + TypeScript. Source is under `src/` (components, hooks, pages, integrations).
- Data & serverless: Uses Supabase. Lightweight backend logic is implemented as Supabase Edge Functions in `supabase/functions/` (no separate Express server).
- AI integration: Frontend calls a Supabase Edge Function named `chat` (via `supabase.functions.invoke('chat')`). The edge function forwards requests to the Lovable AI Gateway.

Key files and patterns (inspect these first)
- `src/components/AIAssistant.tsx` — UI chat widget and quick-action patterns; dynamic-imports the service (`import('@/api/aiAssistantService')`).
- `src/api/aiAssistantService.ts` — client-side wrapper that builds message arrays and invokes the Supabase function `chat`.
- `supabase/functions/chat/index.ts` — server-side prompt assembly and the actual call to `https://ai.gateway.lovable.dev/v1/chat/completions`. Change system prompt, model, or gateway settings here.
- `src/integrations/supabase/client.ts` — Supabase web client; environment variables required for the frontend.
- `tsconfig.json` — path alias `@/*` → `src/*` is used throughout, so prefer `@/path/to/module` imports.
- `package.json` — dev scripts: `npm run dev`, `npm run build`, `npm run preview`.

Environment & secrets
- Frontend needs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (used in `src/integrations/supabase/client.ts`).
- Edge function needs: `LOVABLE_API_KEY` set in the Supabase function environment (see `supabase/functions/chat/index.ts`).

How AI requests flow (concise)
1. User types in `AIAssistant` chat UI (`src/components/AIAssistant.tsx`).
2. UI calls `src/api/aiAssistantService.ts` (dynamically imported) which constructs `messages` and calls `supabase.functions.invoke('chat')`.
3. `supabase/functions/chat/index.ts` builds a system prompt (adds financial `systemData` if provided) and forwards to the Lovable gateway.
4. Gateway returns a response; the edge function returns `{ response, type }` which the client displays.

Project-specific conventions and examples
- Language: responses are expected in Brazilian Portuguese — the edge function enforces this in the `system` prompt.
- Financial context: `systemData` (balance, top expenses, etc.) is injected into the assistant prompt by the edge function — follow the format in `chat/index.ts` when adding new context keys.
- Message shapes: frontend uses arrays of `{ role: 'user'|'assistant', content: string }` — preserve this format when adding conversation history.
- Dynamic import pattern: heavy or optional services are imported with `await import('...')` (see `AIAssistant`), so prefer this for rarely-used code to reduce bundle size.

When you need to change AI behavior
- Edit `supabase/functions/chat/index.ts`: update `systemPrompt`, change the `model` parameter, or adapt response-parsing logic.
- To change client-side handling (types, UI behavior): edit `src/api/aiAssistantService.ts` and `src/components/AIAssistant.tsx` together.

Dev & testing notes
- Start frontend: `npm install` then `npm run dev` (uses Vite).
- If you use the Supabase CLI, you can run or test the function locally: `supabase functions serve chat` (or `supabase functions deploy chat` to update live). If you don't have the CLI, edit `supabase/functions/chat/index.ts` and test through the running app.
- Check env vars: frontend needs `VITE_...` vars locally; the function needs `LOVABLE_API_KEY` in its runtime environment.

Safety and errors
- The edge function returns HTTP 402 for credit issues and 429 for rate limits — UI code handles some errors and shows toast notifications (`sonner`) in `AIAssistant.tsx`.

If something's missing
- Ask for the specific area you want to change (frontend UI, client wrapper, or edge function). Provide the file to edit and the intended behavior and I will patch the code.

Examples (copyable)
- Call pattern used in `aiAssistantService`:
  - `await supabase.functions.invoke('chat', { body: { messages, systemData } })`
- System prompt is assembled in `supabase/functions/chat/index.ts` — change there to affect all responses.

Notes for agents
- Prefer small, surgical edits. Don't change global build config unless necessary.
- Preserve Portuguese wording in prompts unless the user explicitly asks to change the assistant language.
- Keep environment changes minimal: add new `VITE_*` vars for frontend-only config and use function env for secret keys.

-- End of guidance
