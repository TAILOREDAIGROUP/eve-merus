/**
 * Description Matcher — the core routing engine.
 *
 * Given a user request and a list of skill definitions,
 * scores each skill's relevance using three signals:
 *   1. Keyword overlap (TF-IDF-style)
 *   2. Trigger phrase matching (exact/fuzzy)
 *   3. Description similarity (bigram overlap)
 *
 * Returns a ranked list of skills with confidence scores.
 */

export interface SkillDefinition {
  name: string;
  description: string;
  trigger_phrases: string[];
}

export interface MatchResult {
  skill_name: string;
  score: number;
  keyword_score: number;
  trigger_score: number;
  similarity_score: number;
}

// ── Tokenization ───────────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "because", "but", "and", "or", "if", "while", "about", "against",
  "that", "this", "these", "those", "it", "its", "i", "me", "my",
  "we", "our", "you", "your", "he", "him", "his", "she", "her",
  "they", "them", "their", "what", "which", "who", "whom",
]);

/**
 * Simple suffix stemmer for common English suffixes.
 * Not a full Porter stemmer — just handles the most common cases.
 */
function simpleStem(word: string): string {
  if (word.length <= 4) return word;
  return word
    .replace(/ing$/, "")
    .replace(/tion$/, "t")
    .replace(/sion$/, "s")
    .replace(/ness$/, "")
    .replace(/ment$/, "")
    .replace(/able$/, "")
    .replace(/ible$/, "")
    .replace(/er$/, "")
    .replace(/est$/, "")
    .replace(/ed$/, "")
    .replace(/ly$/, "")
    .replace(/ies$/, "y")
    .replace(/s$/, "");
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .map(simpleStem)
    .filter((w) => w.length > 1);
}

function toBigrams(tokens: string[]): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  // Also add individual tokens as unigrams for coverage
  for (const t of tokens) {
    bigrams.add(t);
  }
  return bigrams;
}

// ── Scoring Functions ──────────────────────────────────────

/**
 * Keyword overlap score using weighted term frequency.
 * Words appearing in fewer skill descriptions get higher weight (IDF-like).
 */
function keywordScore(
  requestTokens: string[],
  descTokens: string[],
  idfWeights: Map<string, number>
): number {
  if (requestTokens.length === 0 || descTokens.length === 0) return 0;

  const descSet = new Set(descTokens);
  let score = 0;
  let maxPossible = 0;

  for (const token of requestTokens) {
    const weight = idfWeights.get(token) || 1;
    maxPossible += weight;
    if (descSet.has(token)) {
      score += weight;
    }
  }

  return maxPossible > 0 ? score / maxPossible : 0;
}

/**
 * Trigger phrase matching.
 * Checks if the request contains any of the skill's trigger phrases.
 * Returns highest match quality: exact > partial > word overlap.
 */
function triggerScore(
  requestLower: string,
  requestTokens: string[],
  triggerPhrases: string[]
): number {
  if (triggerPhrases.length === 0) return 0;

  let bestScore = 0;

  for (const phrase of triggerPhrases) {
    const phraseLower = phrase.toLowerCase();

    // Exact containment (highest signal)
    if (requestLower.includes(phraseLower)) {
      const lengthRatio = phraseLower.length / requestLower.length;
      bestScore = Math.max(bestScore, 0.7 + 0.3 * lengthRatio);
      continue;
    }

    // Raw word overlap (preserving stop words for phrase matching)
    const phraseWords = phraseLower.split(/\s+/).filter(Boolean);
    const requestWords = requestLower.split(/\s+/).filter(Boolean);
    if (phraseWords.length > 0) {
      const requestWordSet = new Set(requestWords);
      let rawOverlap = 0;
      for (const w of phraseWords) {
        if (requestWordSet.has(w)) rawOverlap++;
      }
      const rawRatio = rawOverlap / phraseWords.length;
      if (rawRatio >= 0.75) {
        // Near-perfect raw match: almost as strong as exact containment
        bestScore = Math.max(bestScore, 0.5 + rawRatio * 0.35);
      } else if (rawRatio >= 0.5) {
        bestScore = Math.max(bestScore, rawRatio * 0.5);
      }
    }

    // Tokenized word-level overlap (without stop words)
    const phraseTokens = tokenize(phraseLower);
    if (phraseTokens.length === 0) continue;

    const requestSet = new Set(requestTokens);
    let overlap = 0;
    for (const t of phraseTokens) {
      if (requestSet.has(t)) overlap++;
    }

    const ratio = overlap / phraseTokens.length;
    if (ratio > 0.5) {
      bestScore = Math.max(bestScore, ratio * 0.6);
    }
  }

  return bestScore;
}

/**
 * Bigram-based similarity score between request and description.
 * Captures phrase-level matching beyond individual keywords.
 */
function similarityScore(
  requestTokens: string[],
  descTokens: string[]
): number {
  const requestBigrams = toBigrams(requestTokens);
  const descBigrams = toBigrams(descTokens);

  if (requestBigrams.size === 0 || descBigrams.size === 0) return 0;

  let overlap = 0;
  for (const bg of requestBigrams) {
    if (descBigrams.has(bg)) overlap++;
  }

  // Jaccard-style similarity
  const union = new Set([...requestBigrams, ...descBigrams]).size;
  return union > 0 ? overlap / union : 0;
}

// ── IDF Calculation ────────────────────────────────────────

function computeIDF(skills: SkillDefinition[]): Map<string, number> {
  const docFreq = new Map<string, number>();
  const N = skills.length;

  for (const skill of skills) {
    const tokens = new Set(tokenize(
      `${skill.description} ${skill.trigger_phrases.join(" ")}`
    ));
    for (const t of tokens) {
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, df] of docFreq) {
    // Classic IDF: log(N / df) + 1, capped at minimum 1
    idf.set(term, Math.log(N / df) + 1);
  }

  return idf;
}

// ── Main Matcher ───────────────────────────────────────────

const WEIGHT_KEYWORD = 0.20;
const WEIGHT_TRIGGER = 0.55;
const WEIGHT_SIMILARITY = 0.25;

/**
 * Match a request against a list of skills.
 * Returns ranked results, highest score first.
 */
export function matchRequest(
  request: string,
  skills: SkillDefinition[]
): MatchResult[] {
  if (!request.trim() || skills.length === 0) return [];

  const requestLower = request.toLowerCase();
  const requestTokens = tokenize(request);
  const idfWeights = computeIDF(skills);

  const results: MatchResult[] = skills.map((skill) => {
    const descTokens = tokenize(
      `${skill.description} ${skill.trigger_phrases.join(" ")}`
    );

    const kw = keywordScore(requestTokens, descTokens, idfWeights);
    const tr = triggerScore(requestLower, requestTokens, skill.trigger_phrases);
    const sim = similarityScore(requestTokens, descTokens);

    const score =
      WEIGHT_KEYWORD * kw +
      WEIGHT_TRIGGER * tr +
      WEIGHT_SIMILARITY * sim;

    return {
      skill_name: skill.name,
      score: Math.round(score * 10000) / 10000,
      keyword_score: Math.round(kw * 10000) / 10000,
      trigger_score: Math.round(tr * 10000) / 10000,
      similarity_score: Math.round(sim * 10000) / 10000,
    };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get the top matched skill name, or null if no match.
 */
export function topMatch(
  request: string,
  skills: SkillDefinition[]
): string | null {
  const results = matchRequest(request, skills);
  return results.length > 0 ? results[0].skill_name : null;
}
