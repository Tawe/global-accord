# Global Accord — Dashboard & Authentication Spec

## Overview

This document defines the authenticated user experience, game session management, and dashboard behavior. It ensures users can manage multiple negotiation runs while keeping the system simple and performant.

---

## 🎯 Goals

- Provide a clean entry point after login
    
- Allow users to manage up to **3 active games**
    
- Enable creation, resumption, and deletion of games
    
- Surface meaningful status at a glance (turn, commitments, outlook)
    

---

## 🔐 Authentication

### Requirements

- Users must authenticate before accessing the app
    
- Use OAuth (Auth0) for login/logout
    

### States

- **Unauthenticated:** Show “Enter Summit” (login)
    
- **Authenticated:** Show Dashboard
    

---

## 🧭 User Flow

```text
Landing → Login → Dashboard
                ↘ Create Game
                ↘ Resume Game
                ↘ Delete Game
```

---

## 🗂️ Game Model

```ts
interface Game {
  id: string;
  turn: number;            // 1–10
  committed: number;       // 0–5
  countries: any[];        // existing country state
  lastPlayed: number;      // timestamp
}
```

---

## 📊 Dashboard Layout

### Header

- Title: Global Accord
    
- User avatar (optional)
    
- Logout button
    

### Main Section

- Grid of game cards (max 3)
    
- If no games → Empty state
    

---

## 🧱 Game Cards

Each card displays:

- **Game ID / Session Label**
    
- **Turn:** `Turn X / 10`
    
- **Committed:** `Y / 3`
    
- **Outlook:**
    
    - Stable
        
    - Unstable
        
    - Collapsing
        
- **Last Played (optional)**
    

### Card Actions

- **Resume** (primary)
    
- **Delete** (secondary, destructive)
    

---

## 🎯 Outlook Logic

```ts
function getOutlook(game: Game) {
  if (game.committed >= 3) return "Stable";
  if (game.turn >= 8) return "Collapsing";
  return "Unstable";
}
```

---

## ➕ Create Game

### Rule

- Users may have **maximum 3 active games**
    

### Behavior

```text
If games < 3:
  Show “Create New Game” button

If games === 3:
  Disable or hide create button
  Show message: “Maximum active negotiations reached”
```

---

## 🗑️ Delete Game

### Requirements

- Users can delete any game
    
- Must confirm before deletion
    

### Flow

```text
Click Delete → Confirm Dialog → Remove Game → Update UI
```

### Confirmation Copy

> “End this negotiation? Progress will be lost.”

---

## ▶️ Resume Game

### Behavior

- Clicking a card loads the saved game state
    
- Navigates to main game screen
    

---

## 🔥 Backend & Persistence (Firebase)

### Overview

Use Firebase as the primary backend for storing and retrieving game state. This enables persistence across sessions and devices while keeping implementation simple.

---

### Data Structure

```ts
users/{userId}/games/{gameId} {
  turn: number;            // 1–10
  committed: number;       // 0–5
  countries: any[];        // full game state
  createdAt: number;       // timestamp
  updatedAt: number;       // timestamp
}
```

---

### Core Operations

#### Get Games (Dashboard)

```ts
const gamesRef = collection(db, "users", userId, "games");
const snapshot = await getDocs(gamesRef);
```

---

#### Create Game

```ts
await addDoc(collection(db, "users", userId, "games"), {
  turn: 1,
  committed: 0,
  countries: initialState,
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

---

#### Update Game

```ts
await updateDoc(doc(db, "users", userId, "games", gameId), {
  turn,
  committed,
  countries,
  updatedAt: Date.now()
});
```

---

#### Delete Game

```ts
deleteDoc(doc(db, "users", userId, "games", gameId));
```

---

### Auto-Save Behavior

- Save game state after each turn
    
- Trigger on changes to:
    
    - turn
        
    - committed
        
    - countries
        

```ts
useEffect(() => {
  saveGame();
}, [turn, committed, countries]);
```

---

### Security Rules

```ts
match /users/{userId}/games/{gameId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

### Constraints

- Maximum 3 games per user (enforced in UI)
    
- No real-time sync required
    
- No multiplayer support
    

---

## 📭 Empty State

When no games exist:

```text
No negotiations in progress.

Start a new summit.

[ Create New Game ]
```

---

## 💾 Storage Strategy

### MVP

- Use `localStorage`
    
- Keyed per user (Auth0 user ID if available)
    

```ts
localStorage.setItem(`games_${userId}`, JSON.stringify(games))
```

---

## ⚠️ Constraints

- Max 3 games per user
    
- No multiplayer
    
- No real-time sync
    
- Keep logic simple and deterministic
    

---

## 🎨 UX Principles

- Prioritize clarity over density
    
- Make status readable at a glance
    
- Keep interactions minimal (resume, delete, create)
    

---

## Summary

This system provides a lightweight but meaningful persistence layer, enabling replayability and session management without overengineering. It reinforces the product feel while staying aligned with the project’s scope.
