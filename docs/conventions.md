# 📜 Development Conventions: Setlist

These rules ensure that the code stays clean and "soulful" even when multiple people (or agents) are working on it.

---

## 🖋️ Naming Rules

*   **C# Backend:** PascalCase for class names and methods (`ClashEngine`, `GetMatch()`).
*   **React Components:** `PascalCase.tsx` (e.g., `ClashCard.tsx`).
*   **React Hooks:** `useCamelCase.ts` (e.g., `useClashState.ts`).

---

## 🛠️ Code Structure & Logic

*   **Logic Isolation (Frontend):** Keep UI and Logic separate. Use **Custom Hooks** for pulling data/websocket events and **Pure Components** for the visuals.
*   **TypeScript:** No `any`. Everything must be typed.
*   **C# DI:** Dependency Injection is strictly enforced in the ASP.NET Core backend. Keep controllers/hubs thin. Let Services do the heavy lifting.

---

## ✨ Animation Standards

*   All interactive elements must have a **hover state** and a **tap feedback**.
*   Use `Framer Motion` (Web) and `Reanimated` (Mobile) for transitions between screens.
*   The app should look like it's "breathing"—subtle micro-animations in the background.

---

## 🤖 Agent Instructions (For me!)

1.  **Always refer to the Brain:** Check `docs/` and `schema.sql` before architectural decisions.
2.  **Solarized Soul:** Stick to the custom color palette; never use default browser or Tailwind colors.
3.  **Vibe First:** If a feature isn't "stunning," it's not finished.
4.  **C# Learning Focus:** When writing C# code, explain the *why* alongside the *how*, as DoD is actively learning C# concepts from the ground up.
