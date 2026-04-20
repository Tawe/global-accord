# Global Accord — Intro Cinematic Implementation

## Overview

This document translates the intro cinematic script into a scene-by-scene implementation plan. It is designed for fast execution using still images, text overlays, and simple transitions.

---

## 🎬 Technical Approach

- Format: Fullscreen overlay
    
- Assets: Static images per scene
    
- Text: Centered overlay, animated in
    
- Transitions: Fade in / fade out
    
- Timing: 3–5 seconds per scene
    
- Controls: Click or Enter to advance (with optional auto-play)
    

---

## 🎞️ Scene Breakdown

---

### 🌍 Scene 1 — The World

**Image:** Earth from space (dim, desaturated)

**Text Sequence:**

- "The world knows what must be done."
    
- "The science is clear."
    
- "The cost is rising."
    
- "And still… nothing moves fast enough."
    

**Timing:**

- 1.5s per line
    
- Fade between lines
    

**Notes:**

- Subtle zoom-in effect (optional)
    

---

### 🔥 Scene 2 — The Tension

**Image:** Split montage (factories, storms, drought)

**Text Sequence:**

- "Emissions climb."
    
- "Economies strain."
    
- "Promises fracture under pressure."
    
- "Every solution… comes with a cost someone refuses to bear."
    

**Notes:**

- Slight flicker or contrast shift between lines (optional)
    

---

### 🏛️ Scene 3 — The Summit

**Image:** Empty UN-style chamber

**Text Sequence:**

- "So the world does what it always does."
    
- "It gathers."
    
- "It negotiates."
    
- "It hesitates."
    

**Notes:**

- Slow fade-in, no motion needed
    

---

### 🎯 Scene 4 — Your Role

**Image:** Advisor portrait (dim lighting)

**Text Sequence:**

- "This time, you are at the center."
    
- "Not to understand the problem—"
    
- "but to force agreement."
    

**Notes:**

- Slight vignette effect to focus attention
    

---

### 🏭 Scene 5 — Ironvale

**Image:** Industrial skyline, smokestacks

**Text Sequence:**

- "IRONVALE"
    
- "Built on industry."
    
- "Afraid of collapse."
    
- "We will not trade our economy for promises."
    

**Notes:**

- Use bold title for country name
    

---

### 🌞 Scene 6 — Solara

**Image:** Solar fields / renewable landscape

**Text Sequence:**

- "SOLARA"
    
- "Leading the transition."
    
- "Refusing to stand alone."
    
- "We move forward—but not by ourselves."
    

---

### 🏗️ Scene 7 — Deltara

**Image:** Dense city, cranes, growth

**Text Sequence:**

- "DELTARA"
    
- "Rising fast."
    
- "Protecting its future."
    
- "Growth is not negotiable."
    

---

### 🧊 Scene 8 — Nordreach

**Image:** Clean infrastructure, grid systems

**Text Sequence:**

- "NORDREACH"
    
- "Stable. Calculated. Watching."
    
- "If it cannot be implemented, it will not happen."
    

---

### 🌊 Scene 9 — Aqualis

**Image:** Flooded coastline, storm surge

**Text Sequence:**

- "AQUALIS"
    
- "Already paying the price."
    
- "Running out of time."
    
- "We do not need promises. We need survival."
    

---

### ⚖️ Scene 10 — The Challenge

**Image:** All seats filled / silhouettes around table

**Text Sequence:**

- "Five countries."
    
- "Five realities."
    
- "One agreement."
    
- "Or none at all."
    

---

### 🎮 Scene 11 — Player Hook

**Image:** Fade to black

**Text Sequence:**

- "They all understand the problem."
    
- "Your job…"
    
- "is to make them agree."
    

---

## 🧠 Implementation Notes

### State Structure

```
{
  sceneIndex: number,
  lineIndex: number,
  isPlaying: boolean
}
```

---

### Flow Logic

1. Load scene
    
2. Display image
    
3. Animate text line
    
4. Wait for:
    
    - timeout OR
        
    - user input (Enter / click)
        
5. Advance line
    
6. When lines complete → next scene
    

---

### UI Components

- CinematicContainer (fullscreen)
    
- ImageLayer
    
- TextOverlay
    
- InputHandler
    

---

### Transition Rules

- Fade image between scenes (300–500ms)
    
- Fade text between lines (200–300ms)
    
- No complex animations needed
    

---

## 🎯 Design Principles

- Keep text readable and centered
    
- Avoid clutter — one idea per line
    
- Maintain consistent pacing
    
- Let silence and spacing create tension
    

---

## Summary

This cinematic should feel like a controlled, deliberate buildup of tension — moving from global context to personal responsibility. It sets the emotional tone for the entire game without overwhelming the player.
