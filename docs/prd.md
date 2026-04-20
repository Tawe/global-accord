# Global Accord — Product Requirements Document (PRD)

## Overview

Global Accord is an interactive UN-style climate negotiation simulator. The player acts as a global negotiator attempting to secure a multi-country agreement to reduce emissions under conflicting incentives and limited time.

The core idea: solving climate change is not a knowledge problem—it is a coordination problem.

---

## Objective

Demonstrate through gameplay why global climate agreements are difficult to achieve despite clear technical solutions.

---

## Core Game Loop

### Setup

- 5 fictional countries
    
- Each has:
    
    - openness (0–100)
        
    - trust (0–100)
        
    - pressure (0–100)
        
    - hidden need
        
    - committed (true/false)
        

---

### Player Goal

Secure commitments from **3 out of 5 countries** within **10 turns**.

---

### Turn Flow

1. Player selects one action
    
2. Countries respond (AI-generated dialogue)
    
3. System updates values
    
4. Commit checks occur
    
5. UI updates
    
6. Turn counter decreases
    

---

## Player Actions

### 1. Offer Subsidy

- Fossil/Emerging: +20 openness, +10 trust
    
- Others: +5 openness, +5 trust
    
- Side effect: other countries trust -5
    

---

### 2. Share Technology

- All: +10 trust
    
- Nordreach: +10 openness
    
- Deltara: +5 openness
    

---

### 3. Apply Pressure

- Fossil: +25 pressure, -15 trust
    
- Emerging: +15 pressure, -10 trust
    
- Wealthy: +10 pressure, -5 trust
    
- If pressure > 60: +10 openness
    
- If trust < 20: country locks out
    

---

### 4. Propose Agreement

- No stat changes
    
- Runs commit logic
    
- If failed: +5 openness
    

---

## Countries

### Ironvale (Fossil Economy)

- openness: 25
    
- trust: 30
    
- pressure: 10
    
- need: economic stability
    

### Solara (Green Leader)

- openness: 80
    
- trust: 60
    
- pressure: 5
    
- need: others must commit
    

### Deltara (Emerging Economy)

- openness: 40
    
- trust: 35
    
- pressure: 10
    
- need: growth protection
    

### Nordreach (Cautious Wealth)

- openness: 55
    
- trust: 50
    
- pressure: 5
    
- need: grid stability
    

### Aqualis (Vulnerable Nation)

- openness: 75
    
- trust: 45
    
- pressure: 0
    
- need: immediate support
    

---

## Hidden Needs Logic

- Ironvale: subsidy OR trust >= 60
    
- Solara: 2 countries openness >= 65
    
- Deltara: tech shared AND no pressure in last 2 turns
    
- Nordreach: tech shared AND pressure < 30
    
- Aqualis: subsidy used
    

---

## Commitment Conditions

A country commits when:

- openness >= 70
    
- trust >= 50
    
- needSatisfied === true
    
- pressure < 80
    

---

## Global Effects

### Each Turn

- All countries pressure += 5
    

### Agreement Momentum

- When one country commits:
    
    - all others openness += 10
        

### Trust Collapse

- If pressure used twice consecutively:
    
    - all trust -= 10
        

### Favoritism Penalty

- Repeated subsidy to same country:
    
    - others trust -= 10
        

---

## Example Gameplay

### Turn 1

Player: Propose Agreement

- Solara: supports
    
- Ironvale: rejects
    

### Turn 2

Player: Offer Subsidy (Ironvale)

- Ironvale openness increases
    
- Others lose trust
    

### Turn 5

Player: Share Technology

- Nordreach becomes more open
    

### Turn 7

Player: Propose Agreement

- Solara commits
    
- Nordreach nearly commits
    

### Turn 10

Final attempt leads to 3rd commitment → win

---

## AI Role

AI is used for:

- country dialogue
    
- advisor feedback
    
- summarizing state
    

AI does NOT determine outcomes.

---

## Win / Loss Conditions

### Win

- 3+ countries commit before turn limit
    

### Loss

- Turn limit reached without sufficient commitments
    

---

## UI Requirements

- Country cards with status
    
- Turn counter
    
- Action buttons
    
- Dialogue feed
    
- Global progress indicator
    

---

## Leaderboard

### Included (Simple Version)

Track:

- Countries secured
    
- Turns remaining
    

Display:

- Best run
    
- Player result
    

---

## Constraints

- No real countries
    
- No complex simulation
    
- Max 5 actions
    
- Max 10 turns
    

---

## Positioning

Global Accord is a simulation that shows how climate action breaks down under competing incentives—despite clear solutions.
