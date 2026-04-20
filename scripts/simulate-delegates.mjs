/**
 * Mirrors src/App.jsx resolveTurn + helpers to find delegate outcomes.
 * Run: node scripts/simulate-delegates.mjs
 */

const TOTAL_TURNS = 10;
const WIN_TARGET = 3;

const IDS = ["ironvale", "solara", "deltara", "nordreach", "aqualis"];

const BLUEPRINT = {
  ironvale: { openness: 25, trust: 30, pressure: 10 },
  solara: { openness: 80, trust: 60, pressure: 5 },
  deltara: { openness: 40, trust: 35, pressure: 10 },
  nordreach: { openness: 55, trust: 50, pressure: 5 },
  aqualis: { openness: 75, trust: 45, pressure: 0 },
};

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function createInitialState() {
  return {
    turn: 1,
    committed: 0,
    accordSecured: false,
    countries: IDS.map((id) => ({
      id,
      ...BLUEPRINT[id],
      needSatisfied: false,
      committed: false,
      lockedOut: false,
      statusEffects: [],
    })),
    consecutivePressureTurns: 0,
    recentActions: [],
    roomStatusEffects: [],
    outcome: null,
  };
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

function evaluateNeeds(countries, recentActions) {
  const recentPressureWindow = recentActions.slice(-2);
  const lastSubsidy = recentActions[recentActions.length - 1]?.id === "subsidy";
  const techShared = recentActions.some((action) => action.id === "technology");
  const countriesWithHighOpenness = countries.filter((country) => country.openness >= 65).length;

  return countries.map((country) => {
    let needSatisfied = false;
    switch (country.id) {
      case "ironvale":
        needSatisfied =
          lastSubsidy ||
          recentActions.some((action) => action.id === "subsidy" && action.targetId === country.id) ||
          country.trust >= 60;
        break;
      case "solara":
        needSatisfied = countriesWithHighOpenness >= 2;
        break;
      case "deltara":
        needSatisfied =
          techShared && recentPressureWindow.every((action) => action.targetId !== country.id);
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
        if (country.id === "ironvale") nextCountry.trust = clamp(country.trust - 8);
        if (country.id === "solara") nextCountry.openness = clamp(country.openness + 3);
      }
      if (targetId === "ironvale") {
        if (country.id === "deltara") nextCountry.trust = clamp(country.trust - 8);
        if (country.id === "aqualis") nextCountry.trust = clamp(country.trust - 6);
      }
      if (targetId === "aqualis") {
        if (country.id === "solara") {
          nextCountry.trust = clamp(country.trust + 3);
          nextCountry.openness = clamp(country.openness + 2);
        }
        if (country.id === "ironvale") nextCountry.trust = clamp(country.trust - 4);
      }
    }
    if (actionId === "technology") {
      if (country.id === "solara") nextCountry.openness = clamp(country.openness + 3);
      if (country.id === "aqualis") nextCountry.trust = clamp(country.trust + 2);
      if (country.id === "ironvale") nextCountry.trust = clamp(country.trust - 3);
    }
    if (actionId === "pressure") {
      if (targetId === "ironvale") {
        if (country.id === "solara") nextCountry.openness = clamp(country.openness + 5);
        if (country.id === "aqualis") nextCountry.trust = clamp(country.trust + 4);
      }
      if (targetId === "deltara") {
        if (country.id === "ironvale") nextCountry.trust = clamp(country.trust - 5);
        if (country.id === "aqualis") nextCountry.trust = clamp(country.trust - 3);
      }
    }
    if (actionId === "agreement") {
      const readyCountries = countries.filter((entry) => entry.needSatisfied && !entry.lockedOut).length;
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
      if (country.id !== targetId) return country;
      return {
        ...country,
        statusEffects: setStatus(removeStatus(country.statusEffects, "backlash"), "goodwill", 2),
      };
    });
  }
  if (actionId === "pressure" && targetId) {
    nextCountries = nextCountries.map((country) => {
      if (country.id !== targetId) return country;
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
  const committedIds = checkedCountries.filter((country) => country.committed).map((country) => country.id);
  const boostedCountries = checkedCountries.map((country) => {
    if (committedIds.includes(country.id)) return country;
    return { ...country, openness: clamp(country.openness + 5) };
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

function resolveTurn(state, actionId, targetId) {
  let countries = state.countries.map((country) => ({ ...country }));
  let roomStatusEffects = state.roomStatusEffects.map((status) => ({ ...status }));

  if (actionId === "subsidy" && targetId) countries = applySubsidy(countries, targetId);
  if (actionId === "technology") countries = applyTechnology(countries);
  if (actionId === "pressure" && targetId) countries = applyPressure(countries, targetId);
  if (actionId === "agreement") {
    countries = countries.map((country) => ({
      ...country,
      openness: clamp(country.openness + (country.committed ? 0 : 5)),
    }));
  }
  countries = applyCrossCountrySensitivities(countries, actionId, targetId);
  countries = applyStatusEffects(countries, actionId, targetId, roomStatusEffects);
  const consecutivePressureTurns = actionId === "pressure" ? state.consecutivePressureTurns + 1 : 0;
  const usedPressureTwice = consecutivePressureTurns >= 2;
  countries = applyGlobalEffects(countries, usedPressureTwice);
  const recentActions = [...state.recentActions, { id: actionId, targetId, turn: state.turn }];
  countries = evaluateNeeds(countries, recentActions);
  const { countries: committedCountries, newCommitments } = evaluateCommitments(countries);
  const updatedCountries =
    actionId === "agreement" ? committedCountries : evaluateNeeds(committedCountries, recentActions);
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
    nextTurn > TOTAL_TURNS ? (accordSecured ? "success" : "loss") : null;
  return {
    nextState: {
      ...state,
      turn: nextTurn,
      committed: nextCommittedCount,
      accordSecured,
      countries: finalizedStatuses.countries,
      consecutivePressureTurns,
      recentActions,
      roomStatusEffects,
      outcome,
    },
    newCommitments,
  };
}

function runSequence(moves) {
  let s = createInitialState();
  const log = [];
  for (let i = 0; i < moves.length; i++) {
    const { actionId, targetId } = moves[i];
    const { nextState, newCommitments } = resolveTurn(s, actionId, targetId ?? null);
    log.push({
      turn: s.turn,
      action: actionId,
      target: targetId,
      newCommits: newCommitments.map((c) => c.id),
      count: nextState.countries.filter((c) => c.committed).length,
    });
    s = nextState;
  }
  const final = s.countries.filter((c) => c.committed).length;
  return { final, log, state: s };
}

// --- Monte Carlo: bias toward tech + subsidy + agreement, avoid pressure ---
const ACTIONS = ["technology", "agreement", "subsidy", "pressure"];
const TARGETS = IDS;

function randomMove(rng) {
  const a = ACTIONS[Math.floor(rng() * ACTIONS.length)];
  if (a === "technology" || a === "agreement") return { actionId: a, targetId: undefined };
  return { actionId: a, targetId: TARGETS[Math.floor(rng() * TARGETS.length)] };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let best5 = null;
let best3exact = null;
for (let seed = 0; seed < 80000; seed++) {
  const rng = mulberry32(seed);
  const moves = [];
  for (let t = 0; t < 10; t++) moves.push(randomMove(rng));
  const { final } = runSequence(moves);
  if (final >= 5 && !best5) best5 = { seed, moves, final };
  if (final === 3 && !best3exact) best3exact = { seed, moves, final };
  if (best5 && best3exact) break;
}

console.log("Monte Carlo (80k random sequences):");
console.log("  first 5/5 seed:", best5 ? best5.seed : "none found");
console.log("  first exact 3/5 seed:", best3exact ? best3exact.seed : "none found");

// Targeted search: favor tech, subsidy ironvale/aqualis, agreement
const curated = [
  ...Array(3).fill({ actionId: "technology" }),
  { actionId: "subsidy", targetId: "aqualis" },
  { actionId: "subsidy", targetId: "ironvale" },
  { actionId: "agreement" },
  { actionId: "technology" },
  { actionId: "agreement" },
  { actionId: "subsidy", targetId: "deltara" },
  { actionId: "agreement" },
];

const r1 = runSequence(curated);
console.log("\nCurated 10-move (3x tech, subsidies, agreements): final =", r1.final);
console.log(JSON.stringify(r1.log, null, 2));

// Greedy high: lots of tech + agreement + subsidy aqualis/ironvale
const curated2 = [
  { actionId: "technology" },
  { actionId: "subsidy", targetId: "aqualis" },
  { actionId: "technology" },
  { actionId: "subsidy", targetId: "ironvale" },
  { actionId: "technology" },
  { actionId: "agreement" },
  { actionId: "agreement" },
  { actionId: "subsidy", targetId: "nordreach" },
  { actionId: "agreement" },
  { actionId: "agreement" },
];
const r2 = runSequence(curated2);
console.log("\nCurated2 final =", r2.final);
console.log(JSON.stringify(r2.log, null, 2));

// Print best5 moves if found
if (best5) {
  console.log("\n=== Random 5/5 sequence ===");
  console.log(JSON.stringify(best5.moves, null, 2));
  const rr = runSequence(best5.moves);
  console.log("verify final", rr.final, rr.log);
}

if (best3exact) {
  console.log("\n=== Random exact 3/5 sequence ===");
  console.log(JSON.stringify(best3exact.moves, null, 2));
}
