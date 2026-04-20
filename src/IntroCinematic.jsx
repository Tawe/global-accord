import React, { useState, useEffect, useCallback } from 'react';

// Image imports
import advisorPortrait from '../images/advisor-nobg.png';
import aqualisrep from '../images/aqualisrep-nobg.png';
import aqualisBackground from '../images/Aqualisbackground.png';
import deltararep from '../images/deltararep-nobg.png';
import deltaraBackground from '../images/Deltarabackground.png';
import ironvalerep from '../images/ironvalerep-nobg.png';
import ironvaleBackground from '../images/ironvalebackground.png';
import nordreachrep from '../images/nordreachrep-nobg.png';
import nordreachBackground from '../images/Nordreachbackground.png';
import openingTension from '../images/opening-tension.png';
import openingWorld from '../images/opening-world.png';
import room from '../images/room.png';
import solararep from '../images/solararep-nobg.png';
import solaraBackground from '../images/Solarabackground.png';

const CINEMATIC_SCENES = [
  // Scene 1 — The World
  {
    image: openingWorld,
    textSequence: [
      "The world knows what must be done.",
      "The science is clear.",
      "The cost is rising.",
      "And still… nothing moves fast enough.",
    ],
    timing: 1500, // 1.5s per line
    notes: "Subtle zoom-in effect (optional)"
  },
  // Scene 2 — The Tension
  {
    image: openingTension,
    textSequence: [
      "Emissions climb.",
      "Economies strain.",
      "Promises fracture under pressure.",
      "Every solution… comes with a cost someone refuses to bear.",
    ],
    timing: 1500, // 1.5s per line
    notes: "Slight flicker or contrast shift between lines (optional)"
  },
  // Scene 3 — The Summit
  {
    image: room, // Using room.png for UN chamber
    textSequence: [
      "So the world does what it always does.",
      "It gathers.",
      "It negotiates.",
      "It hesitates.",
    ],
    timing: 1500,
    notes: "Slow fade-in, no motion needed"
  },
  // Scene 4 — Your Role
  {
    image: advisorPortrait,
    backgroundImage: room,
    composite: "delegate",
    textSequence: [
      "You will not face the chamber alone.",
      "Your advisor reads the room, the risks, and the pressure points.",
      "Your job is to choose the move that forces agreement.",
    ],
    timing: 1500,
    notes: "Slight vignette effect to focus attention"
  },
  // Scene 5 — Ironvale
  {
    image: ironvalerep,
    backgroundImage: ironvaleBackground,
    composite: "delegate",
    textSequence: [
      "IRONVALE",
      "Built on industry.",
      "Afraid of collapse.",
      "We will not trade our economy for promises.",
    ],
    timing: 1500,
    notes: "Use bold title for country name"
  },
  // Scene 6 — Solara
  {
    image: solararep,
    backgroundImage: solaraBackground,
    composite: "delegate",
    textSequence: [
      "SOLARA",
      "Leading the transition.",
      "Refusing to stand alone.",
      "We move forward—but not by ourselves.",
    ],
    timing: 1500,
  },
  // Scene 7 — Deltara
  {
    image: deltararep,
    backgroundImage: deltaraBackground,
    composite: "delegate",
    textSequence: [
      "DELTARA",
      "Rising fast.",
      "Protecting its future.",
      "Growth is not negotiable.",
    ],
    timing: 1500,
  },
  // Scene 8 — Nordreach
  {
    image: nordreachrep,
    backgroundImage: nordreachBackground,
    composite: "delegate",
    textSequence: [
      "NORDREACH",
      "Stable. Calculated. Watching.",
      "If it cannot be implemented, it will not happen.",
    ],
    timing: 1500,
  },
  // Scene 9 — Aqualis
  {
    image: aqualisrep,
    backgroundImage: aqualisBackground,
    composite: "delegate",
    textSequence: [
      "AQUALIS",
      "Already paying the price.",
      "Running out of time.",
      "We do not need promises. We need survival.",
    ],
    timing: 1500,
  },
  // Scene 10 — The Challenge
  {
    image: room, // Using room.png
    textSequence: [
      "Five countries.",
      "Five realities.",
      "One agreement.",
      "Or none at all.",
    ],
    timing: 1500,
  },
  // Scene 11 — Player Hook
  {
    image: room,
    textSequence: [
      "They all understand the problem.",
      "Your job…",
      "is to make them agree.",
    ],
    timing: 2000,
  },
];

const IntroCinematic = ({ onCinematicEnd }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [showImage, setShowImage] = useState(false); // Controls image fade

  const currentScene = CINEMATIC_SCENES[currentSceneIndex];
  const currentText = currentScene?.textSequence[currentLineIndex];
  const isLastScene = currentSceneIndex === CINEMATIC_SCENES.length - 1;
  const isLastLineInScene = currentLineIndex === currentScene?.textSequence.length - 1;

  const advanceCinematic = useCallback(() => {
    if (!currentScene) return;

    if (isLastLineInScene) {
      if (isLastScene) {
        // End of cinematic
        onCinematicEnd();
        return;
      }
      // Advance to next scene
      setShowText(false); // Fade out text
      setTimeout(() => {
        setShowImage(false); // Fade out image before switching scene content
        setCurrentSceneIndex((prev) => prev + 1);
        setCurrentLineIndex(0);
      }, 500); // Wait for text to fade out
    } else {
      // Advance to next line in current scene
      setShowText(false); // Fade out current line
      setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setShowText(true); // Fade in next line
      }, 300); // Wait for text fade out
    }
  }, [currentScene, currentLineIndex, currentSceneIndex, isLastLineInScene, isLastScene, onCinematicEnd]);

  useEffect(() => {
    // When scene changes, fade in new image
    if (currentScene?.image) {
      setShowImage(true);
    } else {
      setShowImage(false); // No image for this scene
    }

    // Reset text fade state for new scene
    setShowText(true);

    const timer = setTimeout(() => {
      advanceCinematic();
    }, currentScene?.timing || 3000); // Default timing if not specified

    return () => clearTimeout(timer);
  }, [currentSceneIndex, currentLineIndex, currentScene, advanceCinematic]);


  // Handle user input to advance cinematic
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        advanceCinematic();
      }
    };

    const handleClick = () => {
      advanceCinematic();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [advanceCinematic]);

  if (!currentScene) {
    return null; // Should not happen if cinematic ends correctly
  }

  return (
    <div className="cinematic-container">
      {currentScene.backgroundImage && (
        <img
          key={`bg-${currentSceneIndex}`}
          src={currentScene.backgroundImage}
          alt=""
          className={`cinematic-image ${showImage ? 'cinematic-image-active' : ''} cinematic-image-background`}
        />
      )}
      {currentScene.image && (
        <img
          key={`fg-${currentSceneIndex}`}
          src={currentScene.image}
          alt=""
          className={`cinematic-image ${showImage ? 'cinematic-image-active' : ''} ${
            currentScene.composite === 'delegate'
              ? 'cinematic-image-portrait'
              : currentSceneIndex === 2 || currentSceneIndex === 9
                ? 'cinematic-image-dimmed'
                : ''
          }`}
        />
      )}
      <div className={`cinematic-text-overlay ${showText ? 'cinematic-text-active' : ''}`}>
        <p>{currentText}</p>
      </div>
    </div>
  );
};

export default IntroCinematic;
