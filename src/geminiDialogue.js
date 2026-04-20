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

  return [
    "Write dialogue for one turn of a negotiation game.",
    "Tone: serious, human, diplomatic, tense, grounded.",
    "Keep each line to one or two sentences.",
    `Keep the advisor opening under ${MAX_ADVISOR_OPENING_CHARS} characters.`,
    `Keep each country line under ${MAX_COUNTRY_LINE_CHARS} characters.`,
    `Keep the advisor summary under ${MAX_ADVISOR_SUMMARY_CHARS} characters.`,
    "Each country must sound politically distinct.",
    "If the action is targeted, the target should react directly and others should react as observers.",
    "If the action is chamber-wide, everyone should react to the broader room move.",
    "Do not invent mechanics or facts beyond the provided state.",
    "Return ONLY plain text in exactly this format:",
    "ADVISOR_OPENING: <text>",
    "IRONVALE: <text>",
    "SOLARA: <text>",
    "DELTARA: <text>",
    "NORDREACH: <text>",
    "AQUALIS: <text>",
    "ADVISOR_SUMMARY: <text>",
    "",
    JSON.stringify(payload, null, 2),
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
          temperature: 0.9,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    return null;
  }

  return parseTaggedResponse(text, input.orderedCountries);
}
