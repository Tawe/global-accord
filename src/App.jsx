import { useEffect, useMemo, useState, useCallback } from "react";
import IntroCinematic from './IntroCinematic';
import EndingCinematic from './EndingCinematic';
import Dashboard from './Dashboard';
import { useAuth0 } from "@auth0/auth0-react";
import AuthButtons from './AuthButtons';
import { generateTurnDialogue, isGeminiConfigured } from "./geminiDialogue";
import { isFirebaseConfigured } from "./firebase";
import { saveGame } from "./gameSaves";

const TOTAL_TURNS = 10;
const WIN_TARGET = 3;
const TUTORIAL_STORAGE_KEY = "globalAccordTutorialSeen";

const ironvalePortrait = new URL("../images/ironvalerep.png", import.meta.url).href;
const solaraPortrait = new URL("../images/solararep.png", import.meta.url).href;
const deltaraPortrait = new URL("../images/deltararep.png", import.meta.url).href;
const nordreachPortrait = new URL("../images/nordreachrep.png", import.meta.url).href;
const aqualisPortrait = new URL("../images/aqualisrep.png", import.meta.url).href;
const advisorPortrait = new URL("../images/advisor.png", import.meta.url).href;

const ADVISOR = {
  id: "advisor",
  name: "Advisor",
  portrait: advisorPortrait,
};

const TUTORIAL_STEPS = [
  {
    title: "Welcome to the chamber",
    text:
      "Your job is to secure 3 commitments before the summit runs out of time. Every turn is public, and every delegation is watching how you move."
  },
  {
    title: "How countries think",
    text:
      "Each country has its own political need. A move that reassures one delegation can unsettle another if it changes the balance of leverage in the room."
  },
  {
    title: "Targeted versus chamber moves",
    text:
      "Subsidy and Pressure are targeted moves. They are aimed at one delegation, but everyone else reacts as observers. Technology and Agreement address the whole chamber at once."
  },
  {
    title: "How to read the responses",
    text:
      "The first country line shows the direct impact of your move. The others show how the rest of the chamber interprets that shift through its own interests."
  },
  {
    title: "How to win",
    text:
      "Build trust, answer political needs, and then test the room with Agreement when several delegations are close. Move too early, and the chamber will harden."
  }
];

const COUNTRY_BLUEPRINTS = [
  {
    id: "ironvale",
    name: "Ironvale",
    trait: "Fossil economy",
    portrait: ironvalePortrait,
    openness: 25,
    trust: 30,
    pressure: 10,
    need: "economic stability",
  },
  {
    id: "solara",
    name: "Solara",
    trait: "Green leader",
    portrait: solaraPortrait,
    openness: 80,
    trust: 60,
    pressure: 5,
    need: "others must commit",
  },
  {
    id: "deltara",
    name: "Deltara",
    trait: "Emerging economy",
    portrait: deltaraPortrait,
    openness: 40,
    trust: 35,
    pressure: 10,
    need: "growth protection",
  },
  {
    id: "nordreach",
    name: "Nordreach",
    trait: "Cautious wealth",
    portrait: nordreachPortrait,
    openness: 55,
    trust: 50,
    pressure: 5,
    need: "grid stability",
  },
  {
    id: "aqualis",
    name: "Aqualis",
    trait: "Vulnerable nation",
    portrait: aqualisPortrait,
    openness: 75,
    trust: 45,
    pressure: 0,
    need: "immediate support",
  },
];

const ACTIONS = [
  {
    id: "subsidy",
    label: "Offer Subsidy",
    intent: "Ease economic fear and offer immediate support.",
    needsTarget: true,
    scope: "targeted",
    icon: "💰",
    explanation:
      "A direct concession to one delegation. It can calm economic fear or show material support, but the rest of the chamber may resent who benefits first.",
  },
  {
    id: "technology",
    label: "Share Technology",
    intent: "Build trust with practical cooperation.",
    needsTarget: false,
    scope: "chamber",
    icon: "⚙️",
    explanation:
      "A chamber-wide offer. It raises trust across the room and works best with countries that care about practical, buildable transition plans.",
  },
  {
    id: "pressure",
    label: "Apply Pressure",
    intent: "Raise urgency, but risk backlash.",
    needsTarget: true,
    scope: "targeted",
    icon: "⚠️",
    explanation:
      "A direct move on one delegation. It can force urgency, but if trust is already low it may harden opposition and poison the room.",
  },
  {
    id: "agreement",
    label: "Propose Agreement",
    intent: "Test whether the room is ready to commit.",
    needsTarget: false,
    scope: "chamber",
    icon: "📜",
    explanation:
      "A chamber-wide test of the coalition. Use it when several countries are close, because it reveals who is actually ready to commit.",
  },
];

const STATUS_EFFECTS = [
  {
    id: "backlash",
    label: "Backlash",
    explanation:
      "A country carrying Backlash remains distrustful for the next two turns. Further hard moves will land worse until you calm the relationship."
  },
  {
    id: "goodwill",
    label: "Goodwill",
    explanation:
      "A country with Goodwill is more likely to respond to follow-up diplomacy. This is your window to convert support into commitment."
  },
  {
    id: "momentum",
    label: "Momentum",
    explanation:
      "Momentum is a room-wide effect created by fresh commitments. The next agreement push lands more strongly across the chamber."
  }
];

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function createInitialState() {
  return {
    id: crypto.randomUUID(), // Unique ID for each game
    turn: 1,
    committed: 0, // Initialize committed count
    accordSecured: false,
    countries: COUNTRY_BLUEPRINTS.map((country) => ({
      ...country,
      needSatisfied: false,
      committed: false,
      lockedOut: false,
      statusEffects: [],
    })),
    consecutivePressureTurns: 0,
    recentActions: [],
    roomStatusEffects: [],
    outcome: null,
    lastPlayed: Date.now(),
  };
}

function getCountryById(countries, countryId) {
  return countries.find((country) => country.id === countryId);
}

function hasStatus(statusEffects, statusId) {
  return statusEffects.some((status) => status.id === statusId);
}

function setStatus(statusEffects, statusId, turns) {
  const existing = statusEffects.find((status) => status.id === statusId);

  if (!existing) {
    return [...statusEffects, { id: statusId, turns }];
  }

  return statusEffects.map((status) =>
    status.id === statusId ? { ...status, turns: Math.max(status.turns, turns) } : status
  );
}

function removeStatus(statusEffects, statusId) {
  return statusEffects.filter((status) => status.id !== statusId);
}

function tickStatuses(statusEffects) {
  return statusEffects
    .map((status) => ({ ...status, turns: status.turns - 1 }))
    .filter((status) => status.turns > 0);
}

function getStatusMeta(statusId) {
  switch (statusId) {
    case "backlash":
      return { label: "Backlash", tone: "reject" };
    case "goodwill":
      return { label: "Goodwill", tone: "support" };
    case "momentum":
      return { label: "Momentum", tone: "support" };
    default:
      return { label: statusId, tone: "conditional" };
  }
}

function getStance(country) {
  if (country.committed) {
    return { label: "Support", tone: "support" };
  }

  if (country.lockedOut || country.trust < 25) {
    return { label: "Reject", tone: "reject" };
  }

  return { label: "Conditional", tone: "conditional" };
}

function evaluateNeeds(countries, recentActions) {
  const recentPressureWindow = recentActions.slice(-2);
  const lastSubsidy = recentActions[recentActions.length - 1]?.id === "subsidy";
  const techShared = recentActions.some((action) => action.id === "technology");
  const countriesWithHighOpenness = countries.filter(
    (country) => country.openness >= 65
  ).length;

  return countries.map((country) => {
    let needSatisfied = false;

    switch (country.id) {
      case "ironvale":
        needSatisfied =
          lastSubsidy ||
          recentActions.some(
            (action) => action.id === "subsidy" && action.targetId === country.id
          ) ||
          country.trust >= 60;
        break;
      case "solara":
        needSatisfied = countriesWithHighOpenness >= 2;
        break;
      case "deltara":
        needSatisfied =
          techShared &&
          recentPressureWindow.every((action) => action.targetId !== country.id);
        break;
      case "nordreach":
        needSatisfied = techShared && country.pressure < 30;
        break;
      case "aqualis":
        needSatisfied = recentActions.some((action) => action.id === "subsidy");
        break;
      default:
        needSatisfied = false;
    }

    return { ...country, needSatisfied };
  });
}

function applySubsidy(countries, targetId) {
  return countries.map((country) => {
    const nextCountry = { ...country };

    if (country.id === targetId) {
      const majorBoost = country.id === "ironvale" || country.id === "deltara";
      nextCountry.openness = clamp(country.openness + (majorBoost ? 20 : 5));
      nextCountry.trust = clamp(country.trust + (majorBoost ? 10 : 5));
      return nextCountry;
    }

    nextCountry.trust = clamp(country.trust - 5);
    return nextCountry;
  });
}

function applyTechnology(countries) {
  return countries.map((country) => {
    const nextCountry = {
      ...country,
      trust: clamp(country.trust + 7),
    };

    if (country.id === "nordreach") {
      nextCountry.openness = clamp(country.openness + 8);
    }

    if (country.id === "deltara") {
      nextCountry.openness = clamp(country.openness + 4);
    }

    return nextCountry;
  });
}

function applyPressure(countries, targetId) {
  return countries.map((country) => {
    if (country.id !== targetId) {
      return { ...country };
    }

    const nextCountry = { ...country };

    if (country.id === "ironvale") {
      nextCountry.pressure = clamp(country.pressure + 25);
      nextCountry.trust = clamp(country.trust - 15);
    } else if (country.id === "deltara") {
      nextCountry.pressure = clamp(country.pressure + 15);
      nextCountry.trust = clamp(country.trust - 10);
    } else {
      nextCountry.pressure = clamp(country.pressure + 10);
      nextCountry.trust = clamp(country.trust - 5);
    }

    if (nextCountry.pressure > 60) {
      nextCountry.openness = clamp(nextCountry.openness + 10);
    }

    if (nextCountry.trust < 20) {
      nextCountry.lockedOut = true;
    }

    return nextCountry;
  });
}

function applyCrossCountrySensitivities(countries, actionId, targetId) {
  return countries.map((country) => {
    const nextCountry = { ...country };

    if (actionId === "subsidy") {
      if (targetId === "deltara") {
        if (country.id === "ironvale") {
          nextCountry.trust = clamp(country.trust - 8);
        }

        if (country.id === "solara") {
          nextCountry.openness = clamp(country.openness + 3);
        }
      }

      if (targetId === "ironvale") {
        if (country.id === "deltara") {
          nextCountry.trust = clamp(country.trust - 8);
        }

        if (country.id === "aqualis") {
          nextCountry.trust = clamp(country.trust - 6);
        }
      }

      if (targetId === "aqualis") {
        if (country.id === "solara") {
          nextCountry.trust = clamp(country.trust + 3);
          nextCountry.openness = clamp(country.openness + 2);
        }

        if (country.id === "ironvale") {
          nextCountry.trust = clamp(country.trust - 4);
        }
      }
    }

    if (actionId === "technology") {
      if (country.id === "solara") {
        nextCountry.openness = clamp(country.openness + 3);
      }

      if (country.id === "aqualis") {
        nextCountry.trust = clamp(country.trust + 2);
      }

      if (country.id === "ironvale") {
        nextCountry.trust = clamp(country.trust - 3);
      }
    }

    if (actionId === "pressure") {
      if (targetId === "ironvale") {
        if (country.id === "solara") {
          nextCountry.openness = clamp(country.openness + 5);
        }

        if (country.id === "aqualis") {
          nextCountry.trust = clamp(country.trust + 4);
        }
      }

      if (targetId === "deltara") {
        if (country.id === "ironvale") {
          nextCountry.trust = clamp(country.trust - 5);
        }

        if (country.id === "aqualis") {
          nextCountry.trust = clamp(country.trust - 3);
        }
      }
    }

    if (actionId === "agreement") {
      const readyCountries = countries.filter(
        (entry) => entry.needSatisfied && !entry.lockedOut
      ).length;

      if (readyCountries >= 3) {
        nextCountry.openness = clamp(nextCountry.openness + 2);
      } else if (country.id === "solara" || country.id === "aqualis") {
        nextCountry.trust = clamp(nextCountry.trust - 3);
      }
    }

    return nextCountry;
  });
}

function applyStatusEffects(countries, actionId, targetId, roomStatusEffects) {
  const roomHasMomentum = hasStatus(roomStatusEffects, "momentum");

  return countries.map((country) => {
    const nextCountry = { ...country };
    const hasBacklash = hasStatus(country.statusEffects, "backlash");
    const hasGoodwill = hasStatus(country.statusEffects, "goodwill");

    if (hasBacklash && actionId !== "subsidy") {
      nextCountry.trust = clamp(nextCountry.trust - 5);
    }

    if (hasBacklash && actionId === "pressure" && targetId === country.id) {
      nextCountry.trust = clamp(nextCountry.trust - 8);
      nextCountry.pressure = clamp(nextCountry.pressure + 8);
    }

    if (hasGoodwill && actionId === "technology") {
      nextCountry.trust = clamp(nextCountry.trust + 3);
    }

    if (hasGoodwill && actionId === "agreement") {
      nextCountry.openness = clamp(nextCountry.openness + 5);
      nextCountry.trust = clamp(nextCountry.trust + 2);
    }

    if (roomHasMomentum && actionId === "agreement" && !country.committed) {
      nextCountry.openness = clamp(nextCountry.openness + 4);
    }

    return nextCountry;
  });
}

function finalizeStatusEffects(countries, actionId, targetId, newCommitments, roomStatusEffects) {
  let nextCountries = countries.map((country) => ({
    ...country,
    statusEffects: tickStatuses(country.statusEffects),
  }));
  let nextRoomStatusEffects = tickStatuses(roomStatusEffects);

  if (actionId === "subsidy" && targetId) {
    nextCountries = nextCountries.map((country) => {
      if (country.id !== targetId) {
        return country;
      }

      return {
        ...country,
        statusEffects: setStatus(
          removeStatus(country.statusEffects, "backlash"),
          "goodwill",
          2
        ),
      };
    });
  }

  if (actionId === "pressure" && targetId) {
    nextCountries = nextCountries.map((country) => {
      if (country.id !== targetId) {
        return country;
      }

      return {
        ...country,
        statusEffects: setStatus(country.statusEffects, "backlash", 2),
      };
    });
  }

  if (newCommitments.length > 0) {
    nextRoomStatusEffects = setStatus(nextRoomStatusEffects, "momentum", 2);
  }

  return { countries: nextCountries, roomStatusEffects: nextRoomStatusEffects };
}

function applyGlobalEffects(countries, usedPressureTwice) {
  return countries.map((country) => ({
    ...country,
    pressure: clamp(country.pressure + 5),
    trust: clamp(country.trust - (usedPressureTwice ? 10 : 0)),
  }));
}

function evaluateCommitments(countries) {
  let newCommitments = 0;

  const checkedCountries = countries.map((country) => {
    if (country.committed || country.lockedOut) {
      return { ...country };
    }

    const shouldCommit =
      country.openness >= 78 &&
      country.trust >= 58 &&
      country.needSatisfied &&
      country.pressure < 70;

    if (shouldCommit) {
      newCommitments += 1;
      return { ...country, committed: true };
    }

    return { ...country };
  });

  if (newCommitments === 0) {
    return { countries: checkedCountries, newCommitments: [] };
  }

  const committedIds = checkedCountries
    .filter((country) => country.committed)
    .map((country) => country.id);

  const boostedCountries = checkedCountries.map((country) => {
    if (committedIds.includes(country.id)) {
      return country;
    }

    return {
      ...country,
      openness: clamp(country.openness + 5),
    };
  });

  return {
    countries: boostedCountries,
    newCommitments: boostedCountries.filter(
      (country) =>
        committedIds.includes(country.id) &&
        !countries.find((before) => before.id === country.id)?.committed
    ),
  };
}

function getCountryVoice(countryId) {
  switch (countryId) {
    case "ironvale":
      return {
        commit: "These terms finally give our industries a path we can defend at home. Ironvale will join the accord.",
        lockedOut:
          "We will not be pushed into an economic surrender dressed up as diplomacy. Ironvale is stepping back.",
        targetedSubsidy:
          "That is the first offer that speaks to workers, refineries, and the towns built around them. We can keep talking.",
        technology:
          "Technology helps, but only if the transition has a serious industrial plan behind it.",
        targetedPressure:
          "You may raise the heat in this chamber, but you have not answered what happens to our economy outside it.",
        agreementReady:
          "The outline is stronger, but we still need guarantees our transition will not become domestic collapse.",
        agreementBlocked:
          "We cannot sign language that leaves economic stability to chance. That answer is still missing.",
        improved:
          "This is more serious than what we heard before. Keep the economics credible and we may have room.",
        fallback:
          "Ironvale is still measuring this against jobs, energy security, and whether the transition is survivable."
      };
    case "solara":
      return {
        commit:
          "At last, the room is beginning to act like a coalition. Solara will support the accord.",
        lockedOut:
          "If this becomes posturing instead of leadership, the process loses its purpose. We are stepping back.",
        targetedSubsidy:
          "Support matters, but it must build a wider coalition. Symbolism alone will not move this summit.",
        technology:
          "Shared technology is real cooperation. That is how ambition becomes believable.",
        targetedPressure:
          "Urgency is justified, but pressure without solidarity fractures the very coalition we need.",
        agreementReady:
          "The architecture is closer, but we still need confidence that others will actually stand behind it.",
        agreementBlocked:
          "We will not celebrate a text that the rest of the room is not ready to carry.",
        improved:
          "This helps, but ambition only matters when other delegations are willing to move with us.",
        fallback:
          "Solara wants a coalition worthy of the crisis, not another declaration that collapses the moment pressure rises."
      };
    case "deltara":
      return {
        commit:
          "This protects development while asking us to transition. Deltara can accept that balance and commit.",
        lockedOut:
          "You are asking us to absorb the cost and the blame. That is not a deal any serious government could accept.",
        targetedSubsidy:
          "Support is useful when it protects growth instead of punishing it. This gets our attention.",
        technology:
          "Practical technology matters because it lets us modernize without freezing development in place.",
        targetedPressure:
          "If the price of entry is public humiliation and slower growth, you are not building a viable agreement.",
        agreementReady:
          "The structure is improving, but we still need firmer protection for our development path.",
        agreementBlocked:
          "We cannot sign an agreement that treats growth like an inconvenience.",
        improved:
          "You are getting closer, but our delegation still needs proof that transition and growth can coexist.",
        fallback:
          "Deltara is listening for one thing above all: whether development is protected or simply being deferred."
      };
    case "nordreach":
      return {
        commit:
          "The framework is credible enough to implement. Nordreach is prepared to join the accord.",
        lockedOut:
          "This process is no longer being handled with the seriousness implementation requires. We are stepping back.",
        targetedSubsidy:
          "Financing helps, but what we still need is confidence that the system will remain stable under transition.",
        technology:
          "Shared technical capacity materially improves the credibility of this proposal. That is useful.",
        targetedPressure:
          "Pressure may create motion, but it does not create reliable policy. We need competence, not spectacle.",
        agreementReady:
          "The proposal is improving, though some technical guarantees still need to be nailed down.",
        agreementBlocked:
          "The current text still leaves too much unresolved on implementation and grid stability.",
        improved:
          "This is more credible than before, but credibility is not yet the same as readiness.",
        fallback:
          "Nordreach is evaluating whether this can be implemented cleanly, not whether it sounds good in the room."
      };
    case "aqualis":
      return {
        commit:
          "We do not have time for another hollow summit. If this support is real, Aqualis will commit.",
        lockedOut:
          "Do not mistake our vulnerability for patience. If this room turns our survival into leverage, we are done.",
        targetedSubsidy:
          "For once, the room is speaking in concrete support instead of sympathy. That matters to us immediately.",
        technology:
          "Technology helps, but our people cannot live on future promises alone. We still need immediate support.",
        targetedPressure:
          "We live with urgency every day. What we need from this chamber is help, not theatre.",
        agreementReady:
          "This is closer to justice, but we still need assurances we can feel on the ground now.",
        agreementBlocked:
          "Survival cannot remain a footnote in the final language. That is still where this stands.",
        improved:
          "You are closer, but closeness is not protection for the communities already taking the hit.",
        fallback:
          "Aqualis is judging this by whether it delivers protection now, not whether it sounds compassionate."
      };
    default:
      return {
        commit: "We are prepared to commit.",
        lockedOut: "This channel is no longer constructive for us.",
        targetedSubsidy: "That changes the tone of the discussion.",
        technology: "Practical cooperation improves trust.",
        targetedPressure: "Pressure makes compromise harder.",
        agreementReady: "The proposal is moving in a better direction.",
        agreementBlocked: "Our main concern is still unresolved.",
        improved: "This is somewhat better than before.",
        fallback: "Our core concern is still unresolved."
      };
  }
}

function createObserverResponse(country, actionId, targetCountry) {
  switch (country.id) {
    case "ironvale":
      if (actionId === "subsidy" && targetCountry?.id === "deltara") {
        return "If this chamber is underwriting Deltara's rise, do not expect Ironvale to pretend the balance of power is unchanged.";
      }

      if (actionId === "subsidy" && targetCountry?.id === "aqualis") {
        return "Support for vulnerable states is understandable, but the room cannot act as if industrial economies are optional.";
      }

      if (actionId === "pressure" && targetCountry?.id !== "ironvale") {
        return "Today it is them. Tomorrow it is us. Coercion does not build a durable coalition.";
      }

      return "Ironvale is watching whether this move strengthens the room or simply rearranges leverage inside it.";
    case "solara":
      if (actionId === "subsidy" && targetCountry) {
        return `If support for ${targetCountry.name} helps bring another delegation forward, Solara can work with that.`;
      }

      if (actionId === "pressure" && targetCountry) {
        return `Pressure on ${targetCountry.name} may create motion, but solidarity still matters more than spectacle.`;
      }

      return "Solara is judging whether this move actually widens the coalition or just delays the hard choices.";
    case "deltara":
      if (actionId === "subsidy" && targetCountry?.id === "ironvale") {
        return "If the room cushions Ironvale's transition, it cannot ask Deltara to modernize without the same seriousness.";
      }

      if (actionId === "pressure" && targetCountry?.id === "ironvale") {
        return "If major emitters can only be moved by pressure, smaller economies will read that signal very carefully.";
      }

      return "Deltara is watching whether this room protects development fairly or only when powerful countries ask for it.";
    case "nordreach":
      if (actionId === "subsidy" && targetCountry) {
        return `Support for ${targetCountry.name} may help, but the chamber still needs a credible implementation path around it.`;
      }

      if (actionId === "pressure" && targetCountry) {
        return `If pressure on ${targetCountry.name} becomes the method, trust across the chamber will erode quickly.`;
      }

      return "Nordreach is less interested in the symbolism of this move than in whether it makes the wider framework more credible.";
    case "aqualis":
      if (actionId === "subsidy" && targetCountry?.id !== "aqualis") {
        return `If support can be mobilized for ${targetCountry.name}, the chamber cannot claim immediate help for frontline states is impossible.`;
      }

      if (actionId === "pressure" && targetCountry) {
        return `Public pressure on ${targetCountry.name} may satisfy the room for a moment, but it still does not put real support on the table.`;
      }

      return "Aqualis is watching who receives urgency in action and who is still being asked to wait.";
    default:
      return "We are watching what this move means for the rest of the room.";
  }
}

function createCountryResponse(beforeCountry, afterCountry, action, targetCountry, newCommitments) {
  const voice = getCountryVoice(afterCountry.id);
  const wasTarget = targetCountry?.id === afterCountry.id;
  const becameCommitted = newCommitments.some(
    (committedCountry) => committedCountry.id === afterCountry.id
  );
  const becameLockedOut = !beforeCountry.lockedOut && afterCountry.lockedOut;
  const needUnlocked = !beforeCountry.needSatisfied && afterCountry.needSatisfied;

  if (becameCommitted) {
    return voice.commit;
  }

  if (becameLockedOut) {
    return voice.lockedOut;
  }

  if (action.scope === "targeted" && !wasTarget) {
    return createObserverResponse(afterCountry, action.id, targetCountry);
  }

  if (action.id === "subsidy" && wasTarget) {
    return voice.targetedSubsidy;
  }

  if (action.id === "pressure" && wasTarget) {
    return voice.targetedPressure;
  }

  if (action.id === "technology") {
    if (needUnlocked) {
      return `${voice.technology} It answers part of what we have been asking for.`;
    }

    return voice.technology;
  }

  if (action.id === "agreement") {
    if (afterCountry.needSatisfied && afterCountry.openness >= 60) {
      return voice.agreementReady;
    }

    return voice.agreementBlocked;
  }

  if (afterCountry.committed) {
    return voice.commit;
  }

  if (needUnlocked || afterCountry.trust > beforeCountry.trust || afterCountry.openness > beforeCountry.openness) {
    return voice.improved;
  }

  if (!afterCountry.needSatisfied) {
    return voice.fallback;
  }

  return voice.improved;
}

function createAdvisorOpening(action, selectedCountry) {
  if (action.needsTarget && selectedCountry) {
    return `We are making a direct move on ${selectedCountry.name}. They answer first, but the whole chamber will read what it means for them.`;
  }

  return `We are addressing the chamber as a whole. Listen for who sees opportunity, who sees risk, and who still holds back.`;
}

function describeShift(beforeCountry, afterCountry) {
  if (!beforeCountry || !afterCountry) {
    return null;
  }

  if (!beforeCountry.committed && afterCountry.committed) {
    return `${afterCountry.name} committed`;
  }

  if (!beforeCountry.lockedOut && afterCountry.lockedOut) {
    return `${afterCountry.name} shut down`;
  }

  if (!beforeCountry.needSatisfied && afterCountry.needSatisfied) {
    return `${afterCountry.name}'s core need was addressed`;
  }

  const trustDelta = afterCountry.trust - beforeCountry.trust;
  const opennessDelta = afterCountry.openness - beforeCountry.openness;

  if (trustDelta >= 10 || opennessDelta >= 15) {
    return `${afterCountry.name} softened`;
  }

  if (trustDelta <= -10) {
    return `${afterCountry.name} hardened`;
  }

  return null;
}

function describeObserverReaction(action, targetCountry, beforeCountries, afterCountries) {
  if (action.scope !== "targeted" || !targetCountry) {
    return null;
  }

  const observerDeltas = afterCountries
    .filter((country) => country.id !== targetCountry.id)
    .map((country) => {
      const beforeCountry = getCountryById(beforeCountries, country.id) ?? country;
      return {
        country,
        trustDelta: country.trust - beforeCountry.trust,
      };
    })
    .sort((left, right) => left.trustDelta - right.trustDelta);

  const mostAlarmed = observerDeltas[0];

  if (!mostAlarmed || mostAlarmed.trustDelta >= 0) {
    return null;
  }

  if (action.id === "subsidy") {
    return `${mostAlarmed.country.name} read it as favoritism`;
  }

  if (action.id === "pressure") {
    return `${mostAlarmed.country.name} saw the move as coercive`;
  }

  return `${mostAlarmed.country.name} was unsettled by the move`;
}

function createAdvisorSummary(
  beforeCountries,
  afterCountries,
  action,
  targetCountry,
  newCommitments,
  outcome,
  accordSecured
) {
  if (outcome === "success") {
    return "The summit is closing with an accord intact. What matters now is how broad and durable that coalition became.";
  }

  if (outcome === "loss") {
    return "The summit is closing. We ran out of time before the room aligned.";
  }

  const committedCount = afterCountries.filter((country) => country.committed).length;
  const rejectCount = afterCountries.filter(
    (country) => getStance(country).tone === "reject"
  ).length;
  const concreteShift =
    afterCountries
      .map((country) => {
        const beforeCountry = getCountryById(beforeCountries, country.id) ?? country;
        return describeShift(beforeCountry, country);
      })
      .find(Boolean) ?? null;
  const observerReaction = describeObserverReaction(
    action,
    targetCountry,
    beforeCountries,
    afterCountries
  );
  const summaryParts = [];

  if (concreteShift) {
    summaryParts.push(concreteShift);
  }

  if (observerReaction) {
    summaryParts.push(observerReaction);
  }

  if (newCommitments.length > 0) {
    summaryParts.push(
      newCommitments.length === 1
        ? `${newCommitments[0].name} is now onside`
        : `${newCommitments.length} delegations moved into commitment`
    );
  }

  if (summaryParts.length >= 2) {
    if (accordSecured) {
      return `${summaryParts[0]}, but ${summaryParts[1]}. We have an accord now; use the remaining rounds to strengthen it.`;
    }

    return `${summaryParts[0]}, but ${summaryParts[1]}.`;
  }

  if (summaryParts.length === 1) {
    if (accordSecured) {
      return `${summaryParts[0]}. The accord is viable now, but the summit is still open if we want to bring more of the room with us.`;
    }

    if (committedCount >= 2) {
      return `${summaryParts[0]}. Momentum is building around the coalition.`;
    }

    if (rejectCount >= 2) {
      return `${summaryParts[0]}. We still need to rebuild trust in the room.`;
    }

    return `${summaryParts[0]}. The room is still fluid.`;
  }

  if (committedCount >= 2) {
    if (accordSecured) {
      return "We have crossed the threshold for an accord. The remaining task is to make that coalition broader and harder to unravel.";
    }

    return "Momentum is real now. One careful move could turn this into a coalition.";
  }

  if (rejectCount >= 2) {
    return "Resistance is hardening. We need to rebuild trust before we ask for more.";
  }

  return "The room is still open, but nobody feels fully safe yet. Our next move needs to land cleanly.";
}

function describeCountryContext(country, recentActions) {
  if (!country) {
    return "Choose a delegation and I will brief you on where they stand before we move.";
  }

  const lastAction = recentActions[recentActions.length - 1] ?? null;
  const wasLastTarget = lastAction?.targetId === country.id;

  if (country.lockedOut) {
    return `${country.name} has nearly shut the door on us. We pushed too hard, and they no longer trust the room.`;
  }

  if (hasStatus(country.statusEffects, "backlash")) {
    return `${country.name} is still carrying backlash from earlier pressure. Another hard move could deepen the damage.`;
  }

  if (hasStatus(country.statusEffects, "goodwill")) {
    return `${country.name} still has goodwill from our earlier support. This is a good window to consolidate it.`;
  }

  switch (country.id) {
    case "ironvale":
      if (wasLastTarget && lastAction?.id === "pressure") {
        return "We need to be careful. Ironvale did not like the pressure we used last round, and their economy is still centered around fossil fuels.";
      }

      return "Ironvale measures everything against economic stability. If we threaten jobs before we offer reassurance, they will harden immediately.";
    case "solara":
      return "Solara already believes the science. Their question is whether the rest of the room will move with them, not whether the crisis is real.";
    case "deltara":
      if (wasLastTarget && lastAction?.id === "pressure") {
        return "Deltara remembers pressure quickly. They are balancing growth and legitimacy at home, so public coercion can cost us trust fast.";
      }

      return "Deltara is guarding its development path. They want proof that transition will not come at the expense of growth.";
    case "nordreach":
      return "Nordreach responds to competence, not spectacle. They are cautious, technical, and focused on grid stability above rhetoric.";
    case "aqualis":
      return "Aqualis is negotiating from vulnerability. They need visible support now, and they will notice immediately if the room drifts back into abstraction.";
    default:
      return `${country.name} is listening, but their position is still fragile.`;
  }
}

function findMostReadyCountry(countries, excludedId = null) {
  return countries
    .filter((country) => !country.committed && !country.lockedOut && country.id !== excludedId)
    .sort((left, right) => {
      const leftScore =
        left.openness + left.trust + (left.needSatisfied ? 20 : 0) - left.pressure;
      const rightScore =
        right.openness + right.trust + (right.needSatisfied ? 20 : 0) - right.pressure;

      return rightScore - leftScore;
    })[0] ?? null;
}

function describeRoomLeverage(country, action, countries, roomStatusEffects) {
  if (!action) {
    return "";
  }

  const roomHasMomentum = hasStatus(roomStatusEffects, "momentum");
  const bestFollowUp = findMostReadyCountry(countries, country?.id ?? null);

  if (action.id === "subsidy" && country?.id === "deltara") {
    return "If we back Deltara directly, expect Ironvale to watch the balance of leverage very carefully.";
  }

  if (action.id === "subsidy" && country?.id === "ironvale") {
    return "If we cushion Ironvale again, Deltara and Aqualis may read that as the room protecting incumbents first.";
  }

  if (action.id === "subsidy" && country?.id === "aqualis") {
    return "Support for Aqualis is morally strong and should play well with Solara, but Ironvale may resent the precedent.";
  }

  if (action.id === "pressure" && country?.id === "ironvale") {
    return "Pressure on Ironvale may satisfy Solara and Aqualis, but if it turns punitive we still risk a broader backlash.";
  }

  if (action.id === "pressure" && country?.id === "deltara") {
    return "Pressure on Deltara risks convincing the room that development is being cornered rather than negotiated.";
  }

  if (action.id === "technology" && bestFollowUp) {
    return `${bestFollowUp.name} is likely to read a technology move as practical progress, which could open a cleaner agreement window next turn.`;
  }

  if (action.id === "agreement" && roomHasMomentum) {
    return "The room is carrying momentum right now. If we test the agreement, it should land harder than usual.";
  }

  if (action.id === "agreement" && bestFollowUp) {
    return `${bestFollowUp.name} looks closest to readiness. If we test the agreement, they are the most likely to move first.`;
  }

  return "";
}

function describeActionAdvice(country, action, countries, roomStatusEffects) {
  if (!action) {
    return "";
  }

  if (!country) {
    return action.scope === "targeted"
      ? `Select a country first. ${action.label} is a direct move on one delegation while the rest of the room watches.`
      : `${action.label} addresses the chamber as a whole, but each delegation will still read it through its own interests.`;
  }

  switch (action.id) {
    case "subsidy":
      if (country.id === "ironvale" || country.id === "aqualis") {
        return `${action.label} fits ${country.name}. It is a direct concession to them, and the rest of the room will immediately judge who is being empowered.`;
      }

      return `${action.label} could help, but ${country.name} may read it as partial unless it clearly addresses ${country.need}. Others may also resent who benefits first.`;
    case "technology":
      if (country.id === "deltara" || country.id === "nordreach") {
        return `${action.label} is a chamber-wide move that should land well with ${country.name}. They respond when cooperation looks practical and buildable.`;
      }

      return `${action.label} builds trust across the chamber, but it may not fully unlock ${country.name} on its own.`;
    case "pressure":
      if (country.trust <= 35) {
        return `${action.label} is risky right now. ${country.name} is already low on trust, and the whole chamber will notice if the move turns punitive.`;
      }

      return `${action.label} might raise urgency with ${country.name}, but we should expect resentment from them and unease from the observers if we cannot back it with a path forward.`;
    case "agreement":
      if (country.needSatisfied) {
        return `${action.label} is worth testing. It addresses the whole chamber, and ${country.name}'s stated need is closer to satisfied than most.`;
      }

      return `${action.label} is probably early for ${country.name}. Their core need, ${country.need}, is still unresolved, even if others may be ready.`;
    default:
      return action.intent;
  }
}

function createAdvisorChoosingText(country, action, recentActions, countries, roomStatusEffects) {
  const countryContext = describeCountryContext(country, recentActions);
  const actionAdvice = describeActionAdvice(country, action, countries, roomStatusEffects);
  const roomLeverage = describeRoomLeverage(country, action, countries, roomStatusEffects);
  const parts = [countryContext, actionAdvice, roomLeverage].filter(Boolean);
  return parts.slice(0, 2).join(" ");
}

function sortCountriesForDialogue(countries, targetId) {
  return [...countries].sort((left, right) => {
    if (left.id === targetId) {
      return -1;
    }

    if (right.id === targetId) {
      return 1;
    }

    if (left.committed !== right.committed) {
      return left.committed ? 1 : -1;
    }

    return left.name.localeCompare(right.name);
  });
}

function createDialogueQueueFromTextMap(
  orderedCountries,
  advisorOpening,
  advisorSummary,
  countryTexts
) {
  return [
    {
      id: "advisor-open",
      speakerId: ADVISOR.id,
      name: ADVISOR.name,
      portrait: ADVISOR.portrait,
      text: advisorOpening,
    },
    ...orderedCountries.map((country) => ({
      id: `country-${country.id}`,
      speakerId: country.id,
      name: country.name,
      portrait: country.portrait,
      text: countryTexts.get(country.id) ?? "",
    })),
    {
      id: "advisor-summary",
      speakerId: ADVISOR.id,
      name: ADVISOR.name,
      portrait: ADVISOR.portrait,
      text: advisorSummary,
    },
  ];
}

function resolveTurn(state, actionId, targetId) {
  const action = ACTIONS.find((item) => item.id === actionId);
  let countries = state.countries.map((country) => ({ ...country }));
  let roomStatusEffects = state.roomStatusEffects.map((status) => ({ ...status }));

  if (actionId === "subsidy" && targetId) {
    countries = applySubsidy(countries, targetId);
  }

  if (actionId === "technology") {
    countries = applyTechnology(countries);
  }

  if (actionId === "pressure" && targetId) {
    countries = applyPressure(countries, targetId);
  }

  if (actionId === "agreement") {
    countries = countries.map((country) => ({
      ...country,
      openness: clamp(country.openness + (country.committed ? 0 : 5)),
    }));
  }

  countries = applyCrossCountrySensitivities(countries, actionId, targetId);
  countries = applyStatusEffects(countries, actionId, targetId, roomStatusEffects);

  const consecutivePressureTurns =
    actionId === "pressure" ? state.consecutivePressureTurns + 1 : 0;
  const usedPressureTwice = consecutivePressureTurns >= 2;

  countries = applyGlobalEffects(countries, usedPressureTwice);

  const recentActions = [...state.recentActions, { id: actionId, targetId, turn: state.turn }];

  countries = evaluateNeeds(countries, recentActions);

  const { countries: committedCountries, newCommitments } = evaluateCommitments(countries);
  const updatedCountries =
    actionId === "agreement"
      ? committedCountries
      : evaluateNeeds(committedCountries, recentActions);
  const finalizedStatuses = finalizeStatusEffects(
    updatedCountries,
    actionId,
    targetId,
    newCommitments,
    roomStatusEffects
  );
  roomStatusEffects = finalizedStatuses.roomStatusEffects;

  const nextCommittedCount = finalizedStatuses.countries.filter((country) => country.committed).length;
  const nextTurn = state.turn + 1;
  const accordSecured = state.accordSecured || nextCommittedCount >= WIN_TARGET;
  const outcome =
    nextTurn > TOTAL_TURNS
      ? accordSecured
        ? "success"
        : "loss"
      : null;

  return {
    nextState: {
      ...state,
      turn: nextTurn,
      committed: nextCommittedCount, // Add committed count to nextState
      accordSecured,
      countries: finalizedStatuses.countries,
      consecutivePressureTurns,
      recentActions,
      roomStatusEffects,
      outcome,
    },
    newCommitments,
    action,
  };
}

function buildDialogueQueue(
  action,
  selectedCountry,
  beforeCountries,
  afterCountries,
  newCommitments,
  outcome,
  accordSecured
) {
  const orderedCountries = sortCountriesForDialogue(
    afterCountries,
    selectedCountry?.id ?? null
  );

  const countryTexts = new Map(
    orderedCountries.map((country) => {
      const beforeCountry = getCountryById(beforeCountries, country.id) ?? country;

      return [
        country.id,
        createCountryResponse(
          beforeCountry,
          country,
          action,
          selectedCountry ?? null,
          newCommitments
        ),
      ];
    })
  );

  return createDialogueQueueFromTextMap(
    orderedCountries,
    createAdvisorOpening(action, selectedCountry),
    createAdvisorSummary(
      beforeCountries,
      afterCountries,
      action,
      selectedCountry ?? null,
      newCommitments,
      outcome,
      accordSecured
    ),
    countryTexts
  );
}

function CountryCard({ country, selected, onSelect, seatClass }) {
  const stance = getStance(country);

  return (
    <button
      type="button"
      className={`country-card ${seatClass} ${stance.tone} ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <img className="country-avatar" src={country.portrait} alt={`${country.name} delegate`} />
      <h2>{country.name}</h2>
      <p className="country-trait">{country.trait}</p>
      <p className={`stance-pill ${stance.tone}`}>{stance.label}</p>
      {country.statusEffects.length > 0 && (
        <div className="country-status-row">
          {country.statusEffects.map((status) => {
            const meta = getStatusMeta(status.id);

            return (
              <span key={status.id} className={`country-status-chip ${meta.tone}`}>
                {meta.label}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

function ActionHelpModal({ onClose }) {
  return (
    <div className="action-help-overlay" role="dialog" aria-modal="true" aria-label="Action help">
      <div className="action-help-modal">
        <div className="action-help-modal__header">
          <div>
            <p className="action-help-modal__eyebrow">Action Guide</p>
            <h3>How the moves work</h3>
          </div>
          <button type="button" className="action-help-modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="action-help-modal__intro">
          Targeted moves are aimed at one delegation while the chamber watches. Chamber moves address
          everyone at once.
        </p>

        <div className="action-help-list">
          {ACTIONS.map((action) => (
            <article key={action.id} className="action-help-card">
              <div className="action-help-card__title">
                <span className="action-help-card__icon">{action.icon}</span>
                <strong>{action.label}</strong>
                <span className="action-help-card__scope">
                  {action.scope === "targeted" ? "Targeted" : "Chamber-wide"}
                </span>
              </div>
              <p>{action.explanation}</p>
            </article>
          ))}
        </div>

        <div className="action-help-list action-help-list--statuses">
          {STATUS_EFFECTS.map((status) => (
            <article key={status.id} className="action-help-card">
              <div className="action-help-card__title">
                <strong>{status.label}</strong>
              </div>
              <p>{status.explanation}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionPanel({
  advisor,
  selectedCountry,
  selectedAction,
  recentActions,
  countries,
  roomStatusEffects,
  onActionChange,
  onSubmit,
  disabled,
  isGenerating,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const action = ACTIONS.find((item) => item.id === selectedAction);
  const advisorText = createAdvisorChoosingText(
    selectedCountry,
    action,
    recentActions,
    countries,
    roomStatusEffects
  );

  return (
    <>
      <section className="advisor-dock">
        <div className="advisor-dock__media">
          <img
            className="advisor-dock__portrait speaker-avatar-advisor"
            src={advisor.portrait}
            alt={advisor.name}
          />
        </div>

        <div className="advisor-dock__briefing">
          <p className="advisor-dock__label">Advisor Briefing</p>
          <p className="advisor-dock__name">{advisor.name}</p>
          <p className="advisor-dock__text">{advisorText}</p>
        </div>

        <div className="advisor-dock__controls">
          <div className="advisor-dock__controls-header">
            <p className="advisor-dock__label">Choose Action</p>
            <button
              type="button"
              className="advisor-dock__help-button"
              onClick={() => setShowHelp(true)}
              aria-label="Explain action mechanics"
              title="Explain action mechanics"
            >
              i
            </button>
          </div>

          <div className="advisor-dock__actions">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`advisor-action ${
                  selectedAction === action.id ? "is-active" : ""
                }`}
                onClick={() => onActionChange(action.id)}
              >
                <span className="advisor-action__icon">{action.icon}</span>
                <span className="advisor-action__label">
                  {action.id === "technology" ? "Tech" : action.label}
                </span>
              </button>
            ))}
          </div>

          <button type="button" className="advisor-submit" onClick={onSubmit} disabled={disabled}>
            {isGenerating ? "Working..." : "Submit"}
          </button>
        </div>
      </section>

      {showHelp && <ActionHelpModal onClose={() => setShowHelp(false)} />}
    </>
  );
}

function DialoguePanel({ line, onNext, isLast }) {
  return (
    <section className="bottom-panel dialogue-mode">
      <div className="speaker-block">
        <img
          className={`speaker-avatar ${
            line.name === "Advisor" ? "speaker-avatar-advisor" : ""
          }`}
          src={line.portrait}
          alt={line.name}
        />
      </div>

      <div className="panel-main">
        <p className="panel-name">{line.name}</p>
        <p className="panel-text">{line.text}</p>

        <button type="button" className="submit-button" onClick={onNext}>
          {isLast ? "Close" : "Next"}
        </button>
      </div>
    </section>
  );
}

function TutorialPanel({ stepIndex, onNext, onSkip, onFinish, onDontShowAgain }) {
  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Game tutorial">
      <section className="tutorial-panel">
        <div className="tutorial-panel__media">
          <img
            className="tutorial-panel__portrait speaker-avatar-advisor"
            src={ADVISOR.portrait}
            alt={ADVISOR.name}
          />
        </div>

        <div className="tutorial-panel__body">
          <p className="tutorial-panel__eyebrow">
            Advisor Tutorial
            <span className="tutorial-panel__step">
              {stepIndex + 1} / {TUTORIAL_STEPS.length}
            </span>
          </p>
          <h2>{step.title}</h2>
          <p>{step.text}</p>

          <div className="tutorial-panel__actions">
            <button type="button" className="tutorial-panel__button is-ghost" onClick={onSkip}>
              Skip
            </button>
            <button
              type="button"
              className="tutorial-panel__button is-ghost"
              onClick={onDontShowAgain}
            >
              Don't show again
            </button>
            <button
              type="button"
              className="tutorial-panel__button is-primary"
              onClick={isLast ? onFinish : onNext}
            >
              {isLast ? "Start Summit" : "Next"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function GameBoard() {
  const { isAuthenticated, user, isLoading, loginWithRedirect } = useAuth0();
  const [gameState, setGameState] = useState(createInitialState);
  const [phase, setPhase] = useState("choosing");
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [selectedAction, setSelectedAction] = useState("subsidy");
  const [dialogueQueue, setDialogueQueue] = useState([]);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [pendingState, setPendingState] = useState(null);
  const [showCinematic, setShowCinematic] = useState(false);
  const [showEndingCinematic, setShowEndingCinematic] = useState(false);
  const [endingType, setEndingType] = useState(null);
  const [finalGameStateForEnding, setFinalGameStateForEnding] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentPlayingGameId, setCurrentPlayingGameId] = useState(null);
  const [startGameAfterIntro, setStartGameAfterIntro] = useState(false);
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    try {
      return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    } catch (error) {
      return false;
    }
  });

  const committedCount = gameState.countries.filter((country) => country.committed).length;
  const activeLine = dialogueQueue[dialogueIndex] ?? null;
  const selectedCountry = useMemo(
    () => getCountryById(gameState.countries, selectedCountryId),
    [gameState.countries, selectedCountryId]
  );

  const finishTutorial = useCallback((remember = false) => {
    if (remember) {
      try {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
      } catch (error) {
        console.error("Failed to persist tutorial preference:", error);
      }
      setHasSeenTutorial(true);
    }

    setShowTutorial(false);
    setTutorialStepIndex(0);
  }, []);

  const handleStartNewGame = useCallback((userId) => {
    setGameState(createInitialState());
    setCurrentPlayingGameId(null);
    setPhase("choosing");
    setSelectedCountryId(null);
    setSelectedAction("subsidy");
    setDialogueQueue([]);
    setDialogueIndex(0);
    setPendingState(null);
    setShowDashboard(false);
    setStartGameAfterIntro(true);
    setShowTutorial(false);
    setTutorialStepIndex(0);
    setShowCinematic(true);
  }, []);

  const handleResumeGame = useCallback((gameToResume, userId) => {
    setGameState(gameToResume);
    setCurrentPlayingGameId(gameToResume.id);
    setPhase("choosing");
    setSelectedCountryId(null);
    setSelectedAction("subsidy");
    setDialogueQueue([]);
    setDialogueIndex(0);
    setPendingState(null);
    setShowTutorial(false);
    setTutorialStepIndex(0);
    setShowDashboard(false);
  }, []);

  const selectedActionConfig = ACTIONS.find((action) => action.id === selectedAction);
  const submitDisabled =
    gameState.outcome ||
    (selectedActionConfig?.needsTarget && !selectedCountryId) ||
    phase !== "choosing" ||
    isGeneratingDialogue;

  useEffect(() => {
    if (
      !isAuthenticated ||
      !user?.sub ||
      !isFirebaseConfigured ||
      showCinematic ||
      showEndingCinematic ||
      showDashboard ||
      !gameState.id
    ) {
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const committedCountInState = gameState.countries.filter((country) => country.committed).length;
        await saveGame({ ...gameState, committed: committedCountInState }, user.sub);
        if (!cancelled) {
          setSaveError("");
        }
      } catch (error) {
        console.error("Failed to save game to Firestore:", error);
        if (!cancelled) {
          setSaveError(
            error?.code
              ? `Cloud save failed: ${error.code}`
              : "Cloud save failed."
          );
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [gameState, showCinematic, showEndingCinematic, showDashboard, isAuthenticated, user]);


  useEffect(() => {
    if (phase !== "resolving" && phase !== "summary") {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        advanceDialogue();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (!showTutorial) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Enter") {
        event.preventDefault();

        if (tutorialStepIndex === TUTORIAL_STEPS.length - 1) {
          finishTutorial();
          return;
        }

        setTutorialStepIndex((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finishTutorial, showTutorial, tutorialStepIndex]);

  async function handleSubmit() {
    if (submitDisabled) {
      return;
    }

    const { nextState, newCommitments, action } = resolveTurn(
      gameState,
      selectedAction,
      selectedCountryId
    );

    const fallbackQueue = buildDialogueQueue(
      action,
      selectedCountry,
      gameState.countries,
      nextState.countries,
      newCommitments,
      nextState.outcome,
      nextState.accordSecured
    );

    const orderedCountries = sortCountriesForDialogue(
      nextState.countries,
      selectedCountry?.id ?? null
    );

    let queue = fallbackQueue;

    if (isGeminiConfigured()) {
      try {
        setIsGeneratingDialogue(true);
        const generated = await generateTurnDialogue({
          action,
          selectedCountry,
          orderedCountries,
          beforeCountries: gameState.countries,
          afterCountries: nextState.countries,
          newCommitments,
          outcome: nextState.outcome,
          roomStatusEffects: nextState.roomStatusEffects,
        });

        if (generated) {
          queue = createDialogueQueueFromTextMap(
            orderedCountries,
            generated.advisorOpening,
            generated.advisorSummary,
            new Map(generated.countryLines.map((line) => [line.countryId, line.text]))
          );
        }
      } catch (error) {
        console.error("Gemini dialogue generation failed; using local dialogue.", error);
      } finally {
        setIsGeneratingDialogue(false);
      }
    }

    setPendingState(nextState);
    setDialogueQueue(queue);
    setDialogueIndex(0);
    setPhase("resolving");
  }

  function advanceDialogue() {
    const isLast = dialogueIndex >= dialogueQueue.length - 1;

    if (isLast) {
      if (pendingState?.outcome) {
        // Game has ended, determine which ending to show
        const finalCommittedCount = pendingState.countries.filter((country) => country.committed).length;
        let determinedEndingType;
        if (finalCommittedCount >= 5) {
          determinedEndingType = "consensus";
        } else if (finalCommittedCount === 4) {
          determinedEndingType = "strong";
        } else if (finalCommittedCount >= WIN_TARGET) {
          determinedEndingType = "narrow";
        } else if (finalCommittedCount === 2) {
          determinedEndingType = "neutral";
        } else {
          determinedEndingType = "bad";
        }

        setEndingType(determinedEndingType);
        setFinalGameStateForEnding(pendingState);
        setShowEndingCinematic(true);
        // Reset game state for next play, but don't show game board yet
        setGameState(createInitialState());
        setSelectedCountryId(null);
        setSelectedAction("subsidy");
        setPhase("choosing");
        setPendingState(null);
        setDialogueQueue([]);
        setDialogueIndex(0);
        return;
      }

      const nextChoosingPhase = "choosing";
      setGameState(pendingState ?? gameState);
      setPendingState(null);
      setDialogueQueue([]);
      setDialogueIndex(0);
      setPhase(nextChoosingPhase);
      return;
    }

    const nextIndex = dialogueIndex + 1;
    setDialogueIndex(nextIndex);
    setPhase(nextIndex === dialogueQueue.length - 1 ? "summary" : "resolving");
  }

  return (
    <>
      {showCinematic ? (
        <IntroCinematic onCinematicEnd={() => {
          setShowCinematic(false);
          if (startGameAfterIntro) {
            setStartGameAfterIntro(false);
            if (!hasSeenTutorial) {
              setShowTutorial(true);
            }
            return;
          }

          setShowDashboard(true);
        }} />
      ) : showTutorial ? (
        <TutorialPanel
          stepIndex={tutorialStepIndex}
          onNext={() =>
            setTutorialStepIndex((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1))
          }
          onSkip={() => finishTutorial()}
          onFinish={() => finishTutorial()}
          onDontShowAgain={() => finishTutorial(true)}
        />
      ) : showEndingCinematic ? (
        <EndingCinematic
          endingType={endingType}
          finalGameState={finalGameStateForEnding}
          onCinematicEnd={() => {
            setShowEndingCinematic(false);
            setShowDashboard(true);
            setCurrentPlayingGameId(null);
          }}
        />
      ) : showDashboard && isAuthenticated ? (
        <Dashboard
          onStartNewGame={() => {
            handleStartNewGame(user.sub);
          }}
          onResumeGame={(game) => {
            handleResumeGame(game, user.sub);
          }}
        />
      ) : showDashboard && !isAuthenticated ? (
        <div className="login-prompt-container">
            <p>Please log in to manage your games.</p>
            <AuthButtons />
        </div>
      ) : (
        <div className="game-shell">
          <header className="top-bar">
            <div>
              <h1>Global Accord</h1>
            </div>

            <div className="meta-row">
              <div className="meta-pill">
                <span>Turn</span>
                <strong>
                  {Math.min(gameState.turn, TOTAL_TURNS)} / {TOTAL_TURNS}
                </strong>
              </div>
          <div className="meta-pill">
            <span>Committed</span>
            <strong>{committedCount} / 5</strong>
          </div>
          {gameState.roomStatusEffects.length > 0 && (
            <div className="meta-pill">
              <span>Room Status</span>
              <strong>{gameState.roomStatusEffects.map((status) => getStatusMeta(status.id).label).join(", ")}</strong>
            </div>
          )}
          {saveError && (
            <div className="meta-pill">
              <span>Cloud Save</span>
              <strong>{saveError}</strong>
            </div>
          )}
        </div>
      </header>

          <main className="board-stage">
            <div className="table-arc" />
            {gameState.countries.map((country, index) => (
              <CountryCard
                key={country.id}
                country={country}
                selected={selectedCountryId === country.id}
                seatClass={`seat-${index + 1}`}
                onSelect={() => setSelectedCountryId(country.id)}
              />
            ))}
          </main>

          {phase === "choosing" && (
            <ActionPanel
          advisor={ADVISOR}
          selectedCountry={selectedCountry}
          selectedAction={selectedAction}
          recentActions={gameState.recentActions}
          countries={gameState.countries}
          roomStatusEffects={gameState.roomStatusEffects}
          onActionChange={setSelectedAction}
          onSubmit={handleSubmit}
          disabled={Boolean(submitDisabled)}
          isGenerating={isGeneratingDialogue}
        />
      )}

          {(phase === "resolving" || phase === "summary") && activeLine && (
            <DialoguePanel
              line={activeLine}
              onNext={advanceDialogue}
              isLast={dialogueIndex === dialogueQueue.length - 1}
            />
          )}
        </div>
      )}
    </>
  );
}
