# 💾 Data Model: The "Complex Engine" of Setlist

You're 100% right, DoD. The "Clash" is a sophisticated machine, and it needs a robust schema to handle everything you've described. Let's peel back the layers and look at the "Pro-Grade" model.

---

### 🏠 SECTION 1: THE CORE CLASH ENGINE
**`clashes` Table**
*   `id` (uuid, PK)
*   `host_id` (uuid, FK)
*   `name` (text)
*   `status` (enum: *lobby, drafting, drawing, battling, results, archived*)
*   `config` (jsonb: *#songs, #players, draw_system, scoring_system*)
*   `current_match_id` (uuid, FK - Points to the active 1v1 battle)
*   `created_at`, `updated_at`

**`clash_members` Table**
*   `clash_id` (uuid, FK)
*   `user_id` (uuid, FK)
*   `role` (enum: *host, admin, member*)
*   `status` (enum: *invited, pending_approval, joined, rejected*)
*   `draft_quota` (int: how many songs they must contribute)
*   `joined_at`

---

### 🎵 SECTION 2: THE DRAFT & LIBRARY
**`songs` Table (The YouTube Cache)**
*   `id` (text, YouTube ID)
*   `title`, `artist`, `thumbnail_url`, `duration_sec`
*   `metadata` (jsonb: *genre, bpm, etc.*)

**`drafts` Table**
*   `id` (uuid)
*   `clash_id` (uuid, FK)
*   `user_id` (uuid, FK)
*   `song_id` (text, FK)
*   `order_index` (int: for replay sequence)

---

### ⚔️ SECTION 3: THE TOURNAMENT & REPLAY
**`clash_rounds` Table (The Bracket Structure)**
*   `clash_id` (uuid)
*   `round_number` (int: 1 for Round of 16, 2 for Quarter-finals, etc.)
*   `status` (*active, completed*)

**`matches` Table**
*   `id` (uuid)
*   `round_id` (uuid, FK)
*   `song_a_id` (text, FK)
*   `song_b_id` (text, FK)
*   `winner_id` (text, FK)
*   `state` (enum: *waiting, ready, playing, voting, finished*)

**`match_votes` Table**
*   `match_id` (uuid, FK)
*   `user_id` (uuid, FK)
*   `song_choice_id` (text, FK)
*   `voted_at`

---

### 📡 SECTION 4: THE LIVE SOUL (Real-time Sync)
**`listen_party_state` Table (The Heartbeat)**
*   `clash_id` (uuid, FK, Unique)
*   `current_song_id` (text)
*   `is_playing` (bool)
*   `playhead_seconds` (float)
*   `last_sync_at` (timestamptz)

---

### 🧪 Why this is "Pro-Grade":
1.  **The Quota:** Each player's `draft_quota` is explicitly stored, allowing the Host to control the balance.
2.  **The State Machine:** Matches have their own state (*waiting -> playing -> voting*), allowing the "Soulful" animations to trigger exactly when the song ends.
3.  **The Sync:** The `listen_party_state` acts as the "Global Clock" so everyone hears the same chorus at the same second.
4.  **The Replay:** By storing `matches` tied to `rounds` with full vote history, we can reconstruct the *entire* tournament exactly as it happened.

**Is this closer to the "depth" you're envisioning? Tell me what's still missing!**
