import React, { useState, useEffect, useCallback } from 'react';

// Image imports
import advisorPortrait from '../images/advisor-nobg.png';
import endingBadCollapse from '../images/ending-bad-collapse.png';
import endingBadConsequences from '../images/ending-bad-consequences.png';
import endingConsensusChamber from '../images/ending-consensus-chamber.png';
import endingConsensusHistoric from '../images/ending-consensus-historic.png';
import endingNarrowAccord from '../images/ending-narrow-accord.png';
import endingNarrowFragile from '../images/ending-narrow-fragile.png';
import endingNeutralSplit from '../images/ending-neutral-split.png';
import endingNeutralStalled from '../images/ending-neutral-stalled.png';
import endingStrongCoalition from '../images/ending-strong-coalition.png';
import endingStrongDurable from '../images/ending-strong-durable.png';
import room from '../images/room.png';

const ENDING_SCENES = {
  narrow: [
    {
      image: endingNarrowAccord,
      textSequence: ["The accord held.", "Just barely."],
      timing: 1500,
      imageClass: "ending-image-good"
    },
    {
      image: endingNarrowFragile,
      textSequence: ["Enough countries moved.", "Not enough to calm the whole room."],
      timing: 1500,
    },
    {
      image: endingNarrowFragile,
      textSequence: ["The deal survived.", "Its future is still fragile."],
      timing: 1500,
    },
    {
      image: endingNarrowFragile,
      textSequence: ["Movement begins.", "But the coalition is thin."],
      timing: 1500,
    },
    {
      image: endingNarrowFragile,
      textSequence: ["It may be enough.", "If it holds."],
      timing: 2000,
    },
  ],
  strong: [
    {
      image: endingStrongCoalition,
      textSequence: ["Against the odds…", "they agreed."],
      timing: 1500,
      imageClass: "ending-image-good"
    },
    {
      image: endingStrongDurable,
      textSequence: ["The room did not unify.", "But the coalition became durable."],
      timing: 1500,
    },
    {
      image: endingStrongDurable,
      textSequence: ["The agreement has weight.", "It can survive first contact with politics."],
      timing: 1500,
    },
    {
      image: endingStrongDurable,
      textSequence: ["This was no miracle.", "It was negotiation done well."],
      timing: 1500,
    },
    {
      image: endingStrongDurable,
      textSequence: ["It may be enough.", "And this time it has backing."],
      timing: 2000,
    },
  ],
  consensus: [
    {
      image: endingConsensusChamber,
      textSequence: ["Against the odds…", "the whole chamber moved."],
      timing: 1500,
      imageClass: "ending-image-good"
    },
    {
      image: endingConsensusHistoric,
      textSequence: ["Not because conflict vanished.", "But because no one was left outside the deal."],
      timing: 1500,
    },
    {
      image: endingConsensusHistoric,
      textSequence: ["Industry, development, urgency, and caution all found a place at the table."],
      timing: 1500,
    },
    {
      image: endingConsensusHistoric,
      textSequence: ["This is what a historic summit looks like."],
      timing: 1500,
    },
    {
      image: endingConsensusHistoric,
      textSequence: ["For once…", "they agreed together."],
      timing: 2000,
    },
  ],
  neutral: [
    {
      image: endingNeutralSplit,
      textSequence: ["Some agreed.", "Others did not."],
      timing: 1500,
      imageClass: "ending-image-neutral"
    },
    {
      image: endingNeutralStalled,
      textSequence: ["The room never fully aligned."],
      timing: 1500,
    },
    {
      image: endingNeutralStalled,
      textSequence: ["Progress continues…", "but not fast enough."],
      timing: 1500,
    },
    {
      image: endingNeutralStalled,
      textSequence: ["The cost keeps rising."],
      timing: 1500,
    },
    {
      image: endingNeutralStalled,
      textSequence: ["The problem remains."],
      timing: 2000,
    },
  ],
  bad: [
    {
      image: endingBadCollapse,
      textSequence: ["The talks collapsed."],
      timing: 1500,
      imageClass: "ending-image-bad"
    },
    {
      image: endingBadConsequences,
      textSequence: ["Trust broke.", "Positions hardened."],
      timing: 1500,
    },
    {
      image: endingBadConsequences,
      textSequence: ["Each country turned inward."],
      timing: 1500,
    },
    {
      image: endingBadConsequences,
      textSequence: ["The consequences accelerate."],
      timing: 1500,
    },
    {
      image: endingBadConsequences,
      textSequence: ["Everyone understood the problem.", "No one could agree."],
      timing: 2000,
    },
  ],
};

function getCountry(countryId, countries) {
  return countries.find((country) => country.id === countryId);
}

function getCoalitionDescriptor(committedCountries) {
  const committedIds = committedCountries.map((country) => country.id);

  if (committedIds.includes("aqualis") && committedIds.includes("solara")) {
    return "A moral coalition formed around urgency and visible support.";
  }

  if (committedIds.includes("ironvale") && committedIds.includes("nordreach")) {
    return "The accord held because industry and technical credibility were both brought inside the tent.";
  }

  if (committedIds.includes("deltara") && committedIds.includes("solara")) {
    return "The breakthrough came when growth and climate ambition stopped being treated as opposites.";
  }

  if (committedCountries.length >= 3) {
    return "A workable coalition emerged, even if it remained fragile at the edges.";
  }

  return "The room moved, but not into a fully stable coalition.";
}

function getAdvisorLine(endingType, committedCountries, finalGameState) {
  const descriptor = getCoalitionDescriptor(committedCountries);

  if (endingType === "consensus") {
    return `${descriptor} You did more than secure an accord. You built a full summit consensus.`;
  }

  if (endingType === "strong") {
    return `${descriptor} You did not unify everyone, but you built a coalition strong enough to endure.`;
  }

  if (endingType === "narrow") {
    return `${descriptor} You got a real accord over the line, even if it is still politically fragile.`;
  }

  if (endingType === "neutral") {
    return `${descriptor} You proved the room could move, but not far enough before the clock ran down.`;
  }

  const pressureUsed = finalGameState.recentActions.some((action) => action.id === "pressure");

  if (pressureUsed) {
    return "The room never found a stable center. Pressure created motion, but not trust, and the summit broke apart under that strain.";
  }

  return "The room never found a stable center. Everyone saw the crisis, but nobody accepted the same path out of it.";
}

function generateCallouts(endingType, committedCountries, finalGameState) {
  const callouts = [];
  const allCountries = finalGameState.countries;
  const committedIds = committedCountries.map((country) => country.id);
  const lockedOutCountries = allCountries.filter((country) => country.lockedOut);
  const highestPressure = [...allCountries].sort((left, right) => right.pressure - left.pressure)[0];
  const highestTrust = [...allCountries].sort((left, right) => right.trust - left.trust)[0];
  const roomHasMomentum = (finalGameState.roomStatusEffects ?? []).some(
    (status) => status.id === "momentum"
  );

  if (endingType === "consensus") {
    callouts.push("Every delegation ended the summit inside the accord.");
    callouts.push("No country was left outside the final coalition.");
    if (roomHasMomentum) {
      callouts.push("Momentum did not just carry the room. It unified it.");
    }
  }

  if (endingType === "strong") {
    if (committedIds.includes("ironvale")) {
      callouts.push("Ironvale signed only after the deal became economically defensible at home.");
    }

    if (committedIds.includes("nordreach")) {
      callouts.push("Nordreach helped make the agreement feel implementable rather than symbolic.");
    }

    if (!committedIds.includes("aqualis") || !committedIds.includes("solara")) {
      callouts.push("The coalition held, but one part of the room still never fully came in.");
    }
  }

  if (endingType === "narrow") {
    if (committedIds.includes("ironvale")) {
      callouts.push("Ironvale signed only after the deal became economically defensible at home.");
    }

    if (committedIds.includes("aqualis")) {
      callouts.push("Aqualis helped give the final agreement moral weight instead of empty symbolism.");
    }

    if (committedIds.includes("nordreach")) {
      callouts.push("Nordreach brought technical credibility that helped the accord feel implementable.");
    }

    callouts.push("The accord survived, but only with a narrow margin.");
  }

  if (endingType === "neutral") {
    const holdout = allCountries
      .filter((country) => !country.committed)
      .sort((left, right) => right.openness - left.openness)[0];

    if (holdout) {
      callouts.push(`${holdout.name} looked close, but never crossed fully into commitment.`);
    }

    if (lockedOutCountries.length > 0) {
      callouts.push(`${lockedOutCountries[0].name} was effectively lost to the room before the final turn.`);
    }

    if (committedCountries.length === 2) {
      callouts.push("One more aligned delegation would have changed the entire ending.");
    }
  }

  if (endingType === "bad") {
    if (lockedOutCountries.length > 0) {
      callouts.push(`${lockedOutCountries[0].name} shut the door on the process outright.`);
    }

    if (highestPressure) {
      callouts.push(`${highestPressure.name} ended the summit carrying the heaviest political pressure.`);
    }

    if (highestTrust && highestTrust.trust < 45) {
      callouts.push("Even the most cooperative delegation never felt safe enough to anchor a deal.");
    }
  }

  if (callouts.length === 0) {
    callouts.push("The summit ended with the room still divided over who should move first and who should bear the cost.");
  }

  return callouts.slice(0, 3);
}


const EndingCinematic = ({ endingType, finalGameState, onCinematicEnd }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showText, setShowText] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [showPersonalizedEnding, setShowPersonalizedEnding] = useState(false);

  const scenes = ENDING_SCENES[endingType] ?? ENDING_SCENES.neutral;
  const currentScene = scenes[currentSceneIndex];
  const lineCount = currentScene?.textSequence?.length ?? 0;
  const currentText = currentScene?.textSequence?.[currentLineIndex];
  const isLastScene = currentSceneIndex === scenes.length - 1;
  const isLastLineInScene = lineCount > 0 && currentLineIndex === lineCount - 1;

  const committedCountries = finalGameState?.countries?.filter(c => c.committed) || [];
  const advisorLine = getAdvisorLine(endingType, committedCountries, finalGameState);
  const callouts = generateCallouts(endingType, committedCountries, finalGameState);
  const coalitionSummary =
    committedCountries.length > 0
      ? `Committed: ${committedCountries.map((country) => country.name).join(", ")}`
      : "No delegation entered a stable commitment.";

  const advanceCinematic = useCallback(() => {
    if (!currentScene) return;

    if (isLastLineInScene) {
      if (isLastScene) {
        // Transition to personalized ending
        setShowPersonalizedEnding(true);
        setShowText(false);
        setShowImage(false);
        return;
      }
      // Advance to next scene
      setShowText(false);
      setTimeout(() => {
        setCurrentSceneIndex((prev) => prev + 1);
        setCurrentLineIndex(0);
        setShowImage(false);
      }, 500);
    } else {
      // Advance to next line in current scene
      setShowText(false);
      setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setShowText(true);
      }, 300);
    }
  }, [currentScene, currentLineIndex, currentSceneIndex, isLastLineInScene, isLastScene, endingType, committedCountries, finalGameState]);

  useEffect(() => {
    if (showPersonalizedEnding) return;

    if (currentScene?.image) {
      setTimeout(() => setShowImage(true), 100);
    } else {
      setShowImage(false);
    }

    setShowText(true);

    const timer = setTimeout(() => {
      advanceCinematic();
    }, currentScene?.timing || 3000);

    return () => clearTimeout(timer);
  }, [currentSceneIndex, currentLineIndex, currentScene, advanceCinematic, showPersonalizedEnding]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        if (showPersonalizedEnding) {
            onCinematicEnd();
        } else {
            advanceCinematic();
        }
      }
    };

    const handleClick = () => {
        if (showPersonalizedEnding) {
            onCinematicEnd();
        } else {
            advanceCinematic();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [advanceCinematic, onCinematicEnd, showPersonalizedEnding]);

  if (!scenes || !currentScene) {
    return null;
  }

  if (showPersonalizedEnding) {
    return (
      <div className="cinematic-container ending-personalized">
        <img
          src={room}
          alt=""
          className="cinematic-image cinematic-image-active ending-personalized-background"
        />
        <div className="ending-personalized-panel">
          <div className="ending-personalized-media">
            <img
              className="ending-personalized-portrait"
              src={advisorPortrait}
              alt="Advisor"
            />
          </div>
          <div className="ending-personalized-content">
            <p className="advisor-line">{advisorLine}</p>
            <p className="ending-coalition-summary">{coalitionSummary}</p>
            <ul className="country-callouts">
              {callouts.map((callout, index) => (
                <li key={index}>{callout}</li>
              ))}
            </ul>
            <button className="ending-button" onClick={onCinematicEnd}>End Game</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cinematic-container">
      {currentScene.image && (
        <img
          src={currentScene.image}
          alt=""
          className={`cinematic-image ${showImage ? 'cinematic-image-active' : ''} ${currentScene.imageClass || ''}`}
        />
      )}
      <div className={`cinematic-text-overlay ${showText ? 'cinematic-text-active' : ''}`}>
        <p>{currentText}</p>
      </div>
    </div>
  );
};

export default EndingCinematic;
