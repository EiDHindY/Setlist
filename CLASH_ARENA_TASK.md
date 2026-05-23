# Setlist: Clash Arena (Task Master)

> **CRITICAL RULE FOR ALL AGENTS:** 
> Do NOT mark any task as complete `[x]` unless the user (DoD) explicitly tells you to do so. This file tracks our implementation progress.

## Phase 1: The Friend System
The foundational phase to enable real-time multiplayer functionality before any gameplay begins.
- [ ] Implement friend requests and connections.
- [ ] Enable real-time presence so players can connect and interact in real-time.

## Phase 2: Clash Session Creation
The ability for a user to host a new Clash Session (Lobby) and configure the rules for that specific game.
- [ ] Create UI for hosting a new Clash Session.
- [ ] Implement lobby state and rule configuration logic.

## Phase 3: Clash Rules & Branches
Each of these core rules will branch into various versions that we will implement and expand upon over time.

### 1. Number of Players
- [ ] **Branch A:** 1v1 (Direct head-to-head with one friend)
- [ ] **Branch B:** Group Play (Multiple friends in a single session)

### 2. Length (Number of Songs)
- [ ] **Branch A:** Short Session (e.g., 8 songs)
- [ ] **Branch B:** Standard Session (e.g., 16 songs)
- [ ] **Branch C:** Marathon Session (e.g., 32+ songs)

### 3. Format (Regulation)
- [ ] **Branch A:** League (Round Robin - every song battles every other song for points)
- [ ] **Branch B:** Knockout (Tournament Bracket - single elimination)

### 4. Scoring System
- [ ] **Branch A:** Simple Voting (1 vote = 1 point)
- [ ] **Branch B:** Ranked/Elo System (Points awarded based on the difficulty of the matchup)

## Phase 4: Replayability
- [ ] **New Clash:** Initialize a fresh session with a new pool of songs.
- [ ] **Replay Existing Clash:** Restart a previous session with the exact same pool of songs and friends to see if tastes or opinions have changed.
