# MONVEX Dedicated Mobile AI Copilot Design & Architecture Specification

---

## 1. Architectural Overview & Design Philosophy

The **MONVEX Dedicated Mobile AI Copilot** is designed as a native-feeling, mobile-first conversational financial assistant. Rather than shrinking the desktop two-column dashboard down into cramped containers, MONVEX provides a purpose-built single-column mobile interface on smaller viewports (`< 1024px`) while leaving the full-featured desktop AI Copilot (`>= 1024px`) 100% untouched.

```
┌──────────────────────────────────────────────────────────────────┐
│                     MONVEX AI Copilot Engine                     │
│    (Shared State, Real DRF Endpoints, Gemini Grounding, Speech)   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
         ┌───────────────────────┴────────────────────────┐
         ▼                                                ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│     MobileAIWorkspace.tsx       │      │     DesktopAIWorkspace.tsx      │
│  - Viewports: < 1024px          │      │  - Viewports: >= 1024px         │
│  - Full-screen Single Column    │      │  - Two-Column Layout            │
│  - Compact Sticky Header        │      │  - Collapsible History Sidebar  │
│  - Slide-Out History Drawer     │      │  - Model Switcher Pill          │
│  - Full-Width Bubble Stream     │      │  - Split Workspaces             │
│  - Fixed Non-Squishing Composer │      │  - Floating Central Prompt Bar  │
│  - Seamless Mobile Dock Sync    │      │  - 100% Preserved Desktop UX    │
└─────────────────────────────────┘      └─────────────────────────────────┘
```

---

## 2. Viewport Breakpoints & Responsive Strategy

| Viewport | Target Device | Layout Mode | Components Rendered |
| :--- | :--- | :--- | :--- |
| `< 768px` | Mobile Phones (Portrait & Landscape) | `MobileAIWorkspace` | Full-height single column, overlay history drawer, compact header, pinned bottom composer. |
| `768px - 1023px` | Tablets & Foldables | `MobileAIWorkspace` | Enhanced tablet width single-column stream, touch-optimized targets. |
| `>= 1024px` | Laptops, Desktops, Ultrawides | `DesktopAIWorkspace` | Dual-pane desktop interface with sidebar history, large center canvas, model selectors. |

---

## 3. Dedicated Mobile AI Header Structure & Touch Targets

The mobile header is fixed at the top (`h-14`) with a backdrop blur and 44px touch targets:

- **Left Action**: Chat History Drawer trigger (`Clock` / `PanelLeftOpen`), opening the overlay history drawer.
- **Center Identity**: Bold `MONVEX AI` title with live emerald status indicator (`Gemini • Online`).
- **Right Actions**: 
  - Model switcher button displaying active model (`Gemini 2.0 Flash` / `Gemini 1.5 Pro`).
  - New Chat action button (`SquarePen`) for instant session resets.

All interactive elements strictly adhere to the $\ge 44\text{px} \times 44\text{px}$ touch target guideline.

---

## 4. Mobile Slide-Out Chat History Drawer

Rather than occupying permanent horizontal space, the mobile chat history exists as a sleek overlay drawer:

- **Dimensions**: `w-[85vw] max-w-[340px] h-[100dvh] fixed inset-y-0 left-0 z-50`.
- **Backdrop**: Semi-transparent dark overlay (`bg-[#172033]/60 backdrop-blur-sm`) with click-to-dismiss.
- **Search Bar**: Real-time client-side session filtering.
- **Categorization**: Temporal grouping (`Today`, `Yesterday`, `Previous 7 Days`).
- **Actions**: Tap to load conversation & auto-close drawer; trash button to delete sessions.
- **Footer**: Active user identity capsule with pro engine status indicator.

---

## 5. Mobile Welcome & Empty State

When a chat is initialized or cleared (`messages.length === 0`), the mobile workspace presents a high-conversion greeting:

- **Identity**: Centered MONVEX AI gradient badge + title + concise assistant description.
- **Functional Starter Prompts**:
  1. *Monthly Spending Spikes*: Outlier expense scanning.
  2. *Affordability & Savings*: Safe savings allocation calculation.
  3. *Analyze Recent Outflows*: 3-bullet spending optimization breakdown.
  4. *Goal Progress Check*: Monthly cashflow retention vs. savings target.
- Tapping any card immediately initiates live analysis.

---

## 6. Mobile Message Bubble Hierarchy & Layout

- **User Message**:
  - Right-aligned (`ml-auto`).
  - Styled with deep navy tone (`bg-[#172033] text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 max-w-[85%]`).
  - Break-word protection to prevent horizontal scroll leaks.
- **AI Assistant Message**:
  - Left-aligned (`items-start`).
  - Avatar badge + white card (`bg-white border border-[#E4E2DC] rounded-2xl rounded-tl-xs p-3.5 shadow-2xs`).
  - Rich typography rendering with bold pill highlights, bullet points, and numbered lists.
  - Collapsible reasoning drawer (`BrainCircuit`) displaying executed tools and telemetry activity.
  - Google Search Grounding verified web sources & citations.

---

## 7. Mobile Message Actions & Interactive Controls

For assistant messages, a bottom action bar provides direct utilities:

- **Copy**: One-tap clipboard copy with checkmark confirmation.
- **Read Aloud (TTS)**: Web Speech API synthesis with playing wave indicator.
- **Feedback**: Thumbs Up / Thumbs Down feedback hooks.
- **Retry**: Instant prompt regeneration.

---

## 8. Mobile Input Composer Architecture (Avoiding Vertical Word Squishing)

The previous issue where the composer input wrapped word-by-word into vertical columns has been systematically eliminated:

- **Outer Wrapper**: `bg-white/95 border-t border-[#E4E2DC] backdrop-blur-md p-2.5 pb-2`.
- **Input Capsule**: `flex items-end gap-1.5 bg-[#F6F5F1] rounded-2xl border border-[#E4E2DC] p-1.5 px-2 w-full`.
- **Textarea**: `w-full min-w-0 resize-none bg-transparent text-xs font-semibold text-[#172033] placeholder:text-[#858D9A] leading-relaxed max-h-28 py-2.5`.
- **Tools**: Plus attachment trigger, microphone voice input toggle, and send button ($\ge 44\text{px}$ targets).

---

## 9. Virtual Keyboard Handling & Dynamic Viewport Height (`100dvh`)

The mobile container utilizes `h-[calc(100dvh-4rem)]` with `flex flex-col` and `overflow-hidden`:
- As the virtual keyboard expands, the container dynamically resizes without pushing headers offscreen.
- The message stream automatically scrolls to `messagesEndRef` upon focus and sending.

---

## 10. Global Mobile Navigation Dock Integration

- The AI page sits directly above the global `MobileNav.tsx` dock.
- `AppShell.tsx` dynamically detects `pathname === '/ai'` to apply `p-0` on mobile viewports while preserving `lg:p-8` on desktop.
- The global mobile topbar is hidden on `/ai` on mobile to prevent duplicate navigation headers.

---

## 11. Shared State, Real API & Streaming Typewriter Simulator

Both mobile and desktop workspaces share 100% of their logic inside [`web/src/app/ai/page.tsx`](file:///d:/MONVEX/web/src/app/ai/page.tsx):

- `api.askAICopilot(query, conversationId)`: Authenticated REST backend integration with Google Gemini.
- `api.getAIConversations()` / `api.getAIConversation(id)` / `api.deleteAIConversation(id)`: Multi-session management.
- `simulateStreamingResponse()`: Typewriter simulator providing real-time progressive message rendering.

---

## 12. Desktop AI Copilot Regression Shield ($\ge 1024\text{px}$)

The desktop interface in [`web/src/components/ai/DesktopAIWorkspace.tsx`](file:///d:/MONVEX/web/src/components/ai/DesktopAIWorkspace.tsx) remains identical in every respect:
- Full left sidebar with expandable sections and user profile capsule.
- Top segmented switcher (`Chat` / `Financial Work`).
- Central ChatGPT-style floating prompt capsule.
- Full model selector dropdown (`5.6 Terra Extra High`, `Quantum-Finance 1.5 Pro`, `Autonomous Outlier Detective`).

---

## 13. Speech-to-Text & Text-to-Speech Mobile Audio Integration

- **Speech Recognition**: Integrated via Web Speech API (`useSpeechRecognition`) with visual pulsing listening banner and mic button.
- **Text-to-Speech**: SpeechSynthesis API with speech cancellation and active speaker icon states.

---

## 14. Security, Token Scoping & Multi-Tenant Isolation

- **Authentication**: JWT Bearer tokens injected automatically via Axios interceptors.
- **Tenant Scoping**: All telemetry, transaction data, analytics summaries, and conversation sessions are strictly isolated to the authenticated user on the Django backend.
- **No Local Secrets**: Zero API keys or secrets exposed on the client bundle.

---

## 15. Verification, Build Results & Production Deployment Summary

- **TypeScript Compilation**: `npx tsc --noEmit` $\rightarrow$ Exit code 0 (0 errors).
- **Next.js Production Build**: `npm run build` $\rightarrow$ Exit code 0 (all 24 static routes generated successfully).
- **Route Status**:
  - `/ai` (12.1 kB / 138 kB First Load JS) $\rightarrow$ Successfully prerendered.
