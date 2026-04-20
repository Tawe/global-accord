const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const MAX_ADVISOR_OPENING_CHARS = 160;
const MAX_COUNTRY_LINE_CHARS = 180;
const MAX_ADVISOR_SUMMARY_CHARS = 180;

function toBand(value) {
  if (value >= 70) {
    return "high";
  }

  if (value >= 40) {
    return "medium";
  }

  return "low";
}

function toCountrySnapshot(country) {
  return {
    id: country.id,
    name: country.name,
    trait: country.trait,
    need: country.need,
    openness: toBand(country.openness),
    trust: toBand(country.trust),
    pressure: toBand(country.pressure),
    needSatisfied: country.needSatisfied,
    committed: country.committed,
    lockedOut: country.lockedOut,
    statusEffects: (country.statusEffects ?? []).map((status) => status.id),
  };
}

function clampText(text, maxChars) {
  if (typeof text !== "string") {
    return "";
  }

  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxChars - 1);
  const lastBreak = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf(","),
    clipped.lastIndexOf(" ")
  );
  const safeCut = lastBreak > maxChars * 0.6 ? clipped.slice(0, lastBreak) : clipped;

  return `${safeCut.trim()}...`;
}

function buildPrompt({
  action,
  selectedCountry,
  orderedCountries,
  beforeCountries,
  afterCountries,
  newCommitments,
  outcome,
  roomStatusEffects = [],
}) {
  const beforeById = Object.fromEntries(beforeCountries.map((country) => [country.id, country]));
  const payload = {
    game: "Global Accord",
    scene: "UN-style climate negotiation",
    turnContext: {
      action: {
        id: action.id,
        label: action.label,
        intent: action.intent,
        scope: action.scope,
      },
      targetCountryId: selectedCountry?.id ?? null,
      targetCountryName: selectedCountry?.name ?? null,
      outcome: outcome ?? "ongoing",
      newCommitmentIds: newCommitments.map((country) => country.id),
      roomStatusEffects: roomStatusEffects.map((status) => status.id),
    },
    speakingOrder: orderedCountries.map((country) => country.id),
    countries: orderedCountries.map((country) => ({
      before: toCountrySnapshot(beforeById[country.id] ?? country),
      after: toCountrySnapshot(country),
    })),
  };

  const stateJson = JSON.stringify(payload);

  return [
    "Write dialogue for one turn of a UN climate negotiation game. Tone: serious, diplomatic, tense.",
    `Short lines only: advisor opening ≤${MAX_ADVISOR_OPENING_CHARS} chars, each country ≤${MAX_COUNTRY_LINE_CHARS} chars, advisor summary ≤${MAX_ADVISOR_SUMMARY_CHARS} chars. One or two sentences per line.`,
    "Targeted action: target reacts first in order; chamber action: everyone reacts to the room.",
    "Use only facts from the JSON state. Output plain text with EXACTLY these tags in order (no markdown, no extra sections):",
    "ADVISOR_OPENING: ...",
    "IRONVALE: ...",
    "SOLARA: ...",
    "DELTARA: ...",
    "NORDREACH: ...",
    "AQUALIS: ...",
    "ADVISOR_SUMMARY: ...",
    "",
    stateJson,
  ].join("\n");
}

function extractTaggedLine(text, tag) {
  const pattern = new RegExp(`^${tag}:\\s*(.+)$`, "im");
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function parseTaggedResponse(text, orderedCountries) {
  const advisorOpening = clampText(
    extractTaggedLine(text, "ADVISOR_OPENING"),
    MAX_ADVISOR_OPENING_CHARS
  );
  const advisorSummary = clampText(
    extractTaggedLine(text, "ADVISOR_SUMMARY"),
    MAX_ADVISOR_SUMMARY_CHARS
  );

  const countryLines = orderedCountries.map((country) => ({
    countryId: country.id,
    text: clampText(extractTaggedLine(text, country.id.toUpperCase()), MAX_COUNTRY_LINE_CHARS),
  }));

  if (!advisorOpening || !advisorSummary || countryLines.some((line) => !line.text)) {
    return null;
  }

  return {
    advisorOpening,
    advisorSummary,
    countryLines,
  };
}

function logParseFailure(text, orderedCountries) {
  const missing = [];
  if (!extractTaggedLine(text, "ADVISOR_OPENING")) {
    missing.push("ADVISOR_OPENING");
  }
  if (!extractTaggedLine(text, "ADVISOR_SUMMARY")) {
    missing.push("ADVISOR_SUMMARY");
  }
  for (const country of orderedCountries) {
    if (!extractTaggedLine(text, country.id.toUpperCase())) {
      missing.push(country.id.toUpperCase());
    }
  }
  console.warn(
    "[Gemini] Response did not include all required tags; using built-in dialogue. Missing:",
    missing.join(", ") || "(unknown)"
  );
}

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

export async function generateTurnDialogue(input) {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(input),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.85,
          // Seven tagged blocks; must complete before STOP. 1200 still hit MAX_TOKENS on long replies.
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const result = await response.json();

  if (!result?.candidates?.length) {
    console.warn(
      "[Gemini] No response candidates (blocked, quota, or model error). Using built-in dialogue.",
      result?.promptFeedback ?? result?.error ?? ""
    );
    return null;
  }

  const candidate = result.candidates[0];
  const text = candidate?.content?.parts?.[0]?.text;
  const hitTokenLimit = candidate?.finishReason === "MAX_TOKENS";

  if (typeof text !== "string") {
    console.warn("[Gemini] Empty text in response. Using built-in dialogue.");
    return null;
  }

  const parsed = parseTaggedResponse(text, input.orderedCountries);
  if (!parsed) {
    logParseFailure(text, input.orderedCountries);
    if (hitTokenLimit) {
      console.warn(
        "[Gemini] Response truncated (MAX_TOKENS) before all tags were written. If this persists, shorten per-line limits in geminiDialogue.js or simplify the prompt."
      );
    }
  }
  return parsed;
}
