# 📊 Cost & Scale Analysis: The Budget Path

To help DoD code without worrying about bills, here is the breakdown of how "Setlist" achieves production scaling on a strict budget (payable from Egypt).

## 🛠️ Phase 1 (Development) - $0/month

*   **Database & Auth (Supabase Free):** Up to 50K MAUs, 500 MB database space.
*   **Backend Hosting (Render Free):** 512MB RAM, goes to sleep after 15 min of inactivity. Good for coding, bad for production.
*   **Cache (Upstash Free):** 500,000 Redis commands/month.
*   **Web Hosting (Cloudflare Pages Free):** Unlimited bandwidth, 500 builds/month.
*   **Music Data (YouTube Data API v3):** 10,000 quota units/day (~100 searches). Caching song metadata to Redis/Postgres ensures we never hit this limit.

## 🚀 Phase 2 (Production Launch) - ~$5/month

When the Render sleep-timer becomes an issue, we move the backend.
*   **Backend VPS:** Hetzner (~€4/mo) or Contabo (~€5/mo). Gives us a dedicated 24/7 Linux server that can easily run the compiled C# backend and handle thousands of concurrent WebSocket connections.
*   **Database, Cache, Web:** Persist on the free tiers.

## 💳 Payment Strategy

Since typical Egyptian bank cards face international limits, payments for hosting will go through a Virtual USD Mastercard provided by **Grey.co**, which can be funded locally in Egyptian Pounds (EGP).
