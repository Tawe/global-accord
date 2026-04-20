# Global Accord — Design Document

## 🎯 Design Goals

- Make players feel the **friction of global coordination**
    
- Keep gameplay **simple, readable, and fast**
    
- Surface **tradeoffs and unintended consequences**
    
- Ensure the system feels **alive but understandable**
    

---

## 🧠 Core Player Experience

### Emotional Journey

1. **Confidence**
    
    - “I know what to do, this seems straightforward.”
        
2. **Resistance**
    
    - “Why aren’t they agreeing?”
        
3. **Realization**
    
    - “Helping one country hurts another.”
        
4. **Tension**
    
    - “I don’t have enough turns to satisfy everyone.”
        
5. **Insight**
    
    - “This problem is harder than I thought.”
        

---

## 🖥️ UI Layout

### Top Bar

- Turn counter (Turn 3 / 10)
    
- Global emissions indicator (rising / stabilizing)
    

---

### Main Panel (UN Room)

Display all 5 countries at once as cards:

Each card shows:

- Country name
    
- Stance badge:
    
    - ✅ Support
        
    - ⚠️ Conditional
        
    - ❌ Reject
        
- Key trait (short label)
    
- Mini stat bars:
    
    - Openness
        
    - Trust
        

---

### Center Panel (Dialogue Feed)

- Scrollable feed of responses
    
- Each turn shows:
    
    - Player action
        
    - 3–5 country responses (1–2 lines each)
        

---

### Bottom Panel (Actions)

4 large buttons:

- Offer Subsidy
    
- Share Technology
    
- Apply Pressure
    
- Propose Agreement
    

Optional:

- Target selector (dropdown or clickable country card)
    

---

## 🎨 Visual Design Principles

### 1. Clarity over realism

- No globe
    
- No maps
    
- Focus on readability
    

---

### 2. Immediate feedback

- Stats update instantly after action
    
- Stance changes are obvious
    

---

### 3. Minimal text, high meaning

- Keep AI responses to 1–2 sentences
    
- Avoid walls of text
    

---

### 4. Color Language

- Green → progress / agreement
    
- Yellow → uncertainty / conditional
    
- Red → conflict / rejection
    

---

## 🧩 Interaction Design

### Turn Interaction

1. Player clicks an action
    
2. If needed, selects target
    
3. Action executes immediately
    
4. Dialogue animates in
    
5. Stats update visually
    

---

### Commitment Feedback

When a country commits:

- Card highlights (green glow)
    
- Small animation or pulse
    
- Dialogue line:
    
    > “We are prepared to commit to this agreement.”
    

---

### Failure Feedback

When rejected:

- Subtle shake or red flash
    
- Dialogue explains why
    

---

## 🤖 AI Experience Design

### Tone by Country

- Ironvale → blunt, defensive
    
- Solara → idealistic, critical
    
- Deltara → cautious, pragmatic
    
- Nordreach → analytical, measured
    
- Aqualis → urgent, emotional
    

---

### Advisor (Optional)

- Appears as side panel or tooltip
    
- Provides short critiques:
    
    - “This does not address economic concerns.”
        
    - “You are losing trust across the board.”
        

---

## 🎯 Information Hierarchy

Most important:

- Who supports / rejects
    

Second:

- Turn count
    

Third:

- Stats (openness, trust)
    

Least:

- Flavor dialogue
    

---

## 🏁 End States

### Success Screen

- “Agreement Reached”
    
- Countries that committed highlighted
    
- Summary:
    
    - turns used
        
    - strategy insight
        

---

### Failure Screen

- “Talks Collapsed”
    
- Show where things broke down
    

Example:

> “Economic concerns were never resolved.”

---

## 🧠 Design Constraints

- Max 5 countries visible at once
    
- Max 4 actions
    
- Max 10 turns
    
- Max 2 sentences per AI response
    

---

## 🔥 What Makes This Memorable

- Conflicting incentives are visible
    
- No perfect strategy exists
    
- Players feel the system pushing back
    

---

## 🎯 Design Summary

Global Accord should feel like:

> A clean, high-pressure negotiation room where every decision has consequences and no solution is simple.
