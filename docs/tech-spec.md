# Global Accord — Technical Specification

## Overview

This document outlines the technical architecture and implementation plan for the Global Accord simulation game.

---

## 🏗️ Architecture

### Frontend

- Framework: React (Next.js optional)
    
- State Management: useState / useReducer (no need for Redux)
    
- UI:
    
    - Country Cards
        
    - Action Panel
        
    - Dialogue Feed
        
    - Turn Tracker
        
    - Status Indicators
        

---

### Backend (Optional for MVP)

- Node.js (Express or serverless functions)
    
- Handles:
    
    - AI calls
        
    - Leaderboard persistence
        

---

### AI Layer

- Model: Google Gemini API
    
- Used for:
    
    - Country responses
        
    - Advisor feedback
        
    - Turn summaries
        

---

## 📊 Data Models

### Country

```
interface Country {
  name: string;
  openness: number;
  trust: number;
  pressure: number;
  need: string;
  needSatisfied: boolean;
  committed: boolean;
}
```

---

### Game State

```
interface GameState {
  turn: number;
  countries: Country[];
  resources: number;
  lastAction: string;
  pressureUsedLastTurn: boolean;
}
```

---

## 🎮 Game Engine

### Turn Resolver

```
function resolveTurn(action, targetCountry, state) {
  applyActionEffects(action, targetCountry, state);
  updateGlobalEffects(state);
  evaluateNeeds(state);
  evaluateCommitments(state);
  return state;
}
```

---

### Action Handlers

- applySubsidy()
    
- applyTechShare()
    
- applyPressure()
    
- proposeAgreement()
    

Each modifies:

- openness
    
- trust
    
- pressure
    

---

### Need Evaluation

```
function evaluateNeeds(country, state) {
  switch (country.need) {
    case "economic stability":
      country.needSatisfied = country.trust >= 60 || state.lastAction === "subsidy";
      break;
    // others...
  }
}
```

---

### Commitment Check

```
function checkCommit(country) {
  return (
    country.openness >= 70 &&
    country.trust >= 50 &&
    country.needSatisfied &&
    country.pressure < 80
  );
}
```

---

## 🤖 AI Integration

### Prompt Template

Input:

- country name
    
- personality
    
- current stats
    
- player action
    
- result (accept/reject/consider)
    

Example:

"You are Ironvale, a stubborn fossil-fuel economy. The player has offered a subsidy. You are considering but not committing. Respond in 1-2 sentences explaining why."

---

### API Call

- Endpoint: Gemini API
    
- Request per turn (batch country prompts if possible)
    
- Cache responses optionally for repeatability
    

---

## 🧠 Advisor System (Optional)

- Separate Gemini call
    
- Evaluates player message (if enabled)
    
- Returns:
    
    - valid
        
    - weak
        
    - invalid
        

---

## 🗄️ Leaderboard

### Storage Options

- LocalStorage (MVP)
    
- Backend DB (optional)
    

### Data

```
{
  countriesSecured: number,
  turnsRemaining: number,
  timestamp: number
}
```

---

## ⚡ Performance Considerations

- Limit AI responses to 1-2 sentences
    
- Avoid real-time multiplayer
    
- Use batching for AI calls
    

---

## 🚀 Deployment

- Frontend: Vercel / Netlify
    
- Backend: Serverless functions
    

---

## 🔒 Constraints

- Deterministic logic must not rely on AI
    
- AI only used for dialogue and feedback
    

---

## 📦 MVP Scope

Must Have:

- Core loop
    
- 4 actions
    
- 5 countries
    
- AI dialogue
    

Nice to Have:

- Advisor
    
- Leaderboard
    

Cut:

- Multiplayer
    
- Complex data integrations
