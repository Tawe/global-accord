# Global Accord — Ending Cinematic Implementation

## Overview

This document defines three ending cinematics based on player performance: Good, Neutral, and Bad outcomes. Each reinforces the core theme: agreement is difficult, and outcomes are imperfect.

---

## 🎬 Technical Approach

- Same system as intro cinematic
    
- Triggered on game end
    
- Branch based on number of committed countries + turns remaining
    
- 4–6 scenes per ending
    

---

# 🟢 GOOD ENDING — "Fragile Accord"

## Theme

Success, but imperfect and fragile

---

### Scene 1 — Agreement Reached

**Image:** Council chamber, lit, delegates seated

Text:

- "Against the odds…"
    
- "they agreed."
    

---

### Scene 2 — Compromise

**Image:** Papers signed, hands across table

Text:

- "Not everyone is satisfied."
    
- "No one gets everything."
    

---

### Scene 3 — Cost

**Image:** Industry slowing / transition visuals

Text:

- "Some economies strain."
    
- "Some risks remain."
    

---

### Scene 4 — Movement

**Image:** Renewables, rebuilding, mixed progress

Text:

- "But movement begins."
    
- "For the first time… together."
    

---

### Scene 5 — Closing

**Image:** Earth, slightly brighter

Text:

- "It may be enough."
    
- "If it holds."
    

---

# 🟡 NEUTRAL ENDING — "Stalled Progress"

## Theme

Partial success, insufficient action

---

### Scene 1 — Partial Agreement

**Image:** Some seats empty

Text:

- "Some agreed."
    
- "Others did not."
    

---

### Scene 2 — Division

**Image:** Split visuals between countries

Text:

- "The room never fully aligned."
    

---

### Scene 3 — Delay

**Image:** Ongoing emissions, slow change

Text:

- "Progress continues…"
    
- "but not fast enough."
    

---

### Scene 4 — Consequences

**Image:** Climate impact scenes

Text:

- "The cost keeps rising."
    

---

### Scene 5 — Closing

**Image:** Earth, unchanged or dimmer

Text:

- "The problem remains."
    

---

# 🔴 BAD ENDING — "Talks Collapse"

## Theme

Failure, conflict, consequences

---

### Scene 1 — Breakdown

**Image:** Empty chamber / chairs pushed back

Text:

- "The talks collapsed."
    

---

### Scene 2 — Fracture

**Image:** Delegates leaving / tension

Text:

- "Trust broke."
    
- "Positions hardened."
    

---

### Scene 3 — Escalation

**Image:** Heavy industry, rising emissions

Text:

- "Each country turned inward."
    

---

### Scene 4 — Impact

**Image:** Severe climate events

Text:

- "The consequences accelerate."
    

---

### Scene 5 — Closing

**Image:** Darkened Earth

Text:

- "Everyone understood the problem."
    
- "No one could agree."
    

---

## 🧠 Trigger Logic

```
if (committed >= 3) → Good
if (committed === 2) → Neutral
if (committed <= 1) → Bad
```

---

## 🎯 Design Notes

- Keep tone consistent with intro
    
- Avoid celebrating success too strongly
    
- Emphasize tradeoffs and consequences
    
- Keep lines short and impactful
    

---

## 🧠 Personalized Endings (Advisor + Country Callouts)

Add a final, personal layer after each ending cinematic to connect the outcome to the player and the actors in the room.

---

### 🟢 GOOD — Advisor Line

> “You didn’t solve everything… but you moved the world. That matters.”

**Country Callouts (example logic):**

- List 2–3 notable outcomes based on state
    
- Prioritize: holdouts, early committers, swing votes
    

**Examples:**

- “Ironvale held out until the end.”
    
- “Aqualis committed early.”
    
- “Nordreach demanded final guarantees.”
    

---

### 🟡 NEUTRAL — Advisor Line

> “You made progress. Just not enough. Not this time.”

**Country Callouts:**

- Highlight divisions and near-misses
    

**Examples:**

- “Deltara never accepted the terms.”
    
- “Solara pushed for more, but stood mostly alone.”
    
- “One more agreement could have changed everything.”
    

---

### 🔴 BAD — Advisor Line

> “They all understood the problem. That wasn’t the issue.”

**Country Callouts:**

- Emphasize breakdowns and conflicts
    

**Examples:**

- “Pressure fractured the room.”
    
- “Ironvale rejected the terms outright.”
    
- “Trust never recovered.”
    

---

## 🎯 Implementation Notes (Personal Layer)

- Trigger after final scene text
    
- Display as separate overlay or final card
    
- Structure:
    
    - Advisor portrait + line
        
    - 2–3 bullet callouts
        
- Keep concise (no paragraphs)
    
- Derive callouts from game state:
    
    - committed countries
        
    - highest pressure target
        
    - lowest trust country
        
    - last action impact
        

---

