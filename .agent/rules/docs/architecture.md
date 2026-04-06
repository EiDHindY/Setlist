# 🏗️ Architecture & Folder Structure: Setlist

We use a separated multi-repo approach consisting of three entirely independent directories, allowing the backend (C#) and the frontends to remain decoupled.

---

## 📂 Folder Map

```text
/backend       <- ASP.NET Core 10 Web API / SignalR Server (The "Kitchen")
/web           <- Next.js 16 Website (The "Desktop Dining Room")
/mobile        <- Flutter App (The "Mobile Dining Room")
/docs          <- You are here!
/schema.sql    <- Supabase SQL Database schema
```

---

## 📡 The Communication Flow

1. **Client (Web/Mobile):** Sends a request / opens a WebSocket connection to the **C# Backend**.
2. **C# Backend (ASP.NET Core / SignalR):** Handles all logic, bracket calculation, voting, and sync. It talks directly to **Supabase (PostgreSQL)** for persistence.
3. **Real-time Sync (SignalR):** The backend maintains real-time websocket connections to all users in a Clash (rooms/groups), pushing out playhead updates and vote counts instantly.

## 🧵 State Management

* **Frontend (Web):** We'll use **Zustand** for global UI state.
* **Frontend (Mobile):** Flutter's built-in State Management (Provider/Riverpod or Bloc).
* **Backend:** **Redis** handles ephemeral caching and state (Listen Party sync), while **PostgreSQL** handles persistent data.

## 🎨 Shared UI Patterns

The `web` and `mobile` apps both follow the **Solarized Dark** theme using Tailwind (Web) and Flutter Custom Themes (Mobile). Transitions should be fluid and soulful.
