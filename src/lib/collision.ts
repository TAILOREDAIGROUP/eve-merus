/**
 * Collision Detector — analyzes all skill pairs for description overlap.
 *
 * For each pair, calculates overlap using:
 *   1. Shared keywords (IDF-weighted)
 *   2. Shared trigger phrases (exact + partial)
 *   3. Bigram similarity between descriptions
 *
 * Returns ranked collision pairs with severity classification.
 */

import { tokenize } from "./matcher";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface CollisionPair {
  skill_a: string;
  skill_b: string;
  overlap_pct: number;
  shared_keywords: string[];
  shared_triggers: string[];
  severity: Severity;
  keyword_overlap: number;
  trigger_overlap: number;
  bigram_overlap: number;
  recommendation: string;
}

export interface CollisionAnalysis {
  library_id: string;
  total_pairs: number;
  collision_pairs: CollisionPair[];
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  clean_count: number;
  overall_collision_score: number; // 0-100, higher = more collisions
}

export interface SkillForCollision {
  name: string;
  description: string;
  trigger_phrases: string[];
}

// ── Severity Classification ────────────────────────────────

function classifySeverity(overlapPct: number): Severity {
  if (overlapPct > 50) return "CRITICAL";
  if (overlapPct > 30) return "HIGH";
  if (overlapPct > 15) return "MEDIUM";
  return "LOW";
}

function recommendAction(severity: Severity, pair: { skill_a: string; skill_b: string }): string {
  switch (severity) {
    case "CRITICAL":
      return `Consider merging "${pair.skill_a}" and "${pair.skill_b}" or adding explicit routing rules to disambiguate.`;
    case "HIGH":
      return `Tighten trigger boundaries between "${pair.skill_a}" and "${pair.skill_b}". Remove shared trigger phrases.`;
    case "MEDIUM":
      return `Add explicit routing keywords to differentiate "${pair.skill_a}" from "${pair.skill_b}".`;
    case "LOW":
      return `Minor overlap — monitor but no action needed.`;
  }
}

// ── IDF Computation ────────────────────────────────────────

function computeIDF(skills: SkillForCollision[]): Map<string, number> {
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
    idf.set(term, Math.log(N / df) + 1);
  }
  return idf;
}

// ── Pairwise Comparison ────────────────────────────────────

function getTokenSet(skill: SkillForCollision): Set<string> {
  return new Set(tokenize(
    `${skill.description} ${skill.trigger_phrases.join(" ")}`
  ));
}

function toBigrams(tokens: string[]): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

function computeKeywordOverlap(
  tokensA: Set<string>,
  tokensB: Set<string>,
  idf: Map<string, number>
): { score: number; shared: string[] } {
  const shared: string[] = [];
  let sharedWeight = 0;
  let totalWeight = 0;

  const allTokens = new Set([...tokensA, ...tokensB]);
  for (const t of allTokens) {
    const w = idf.get(t) || 1;
    totalWeight += w;
    if (tokensA.has(t) && tokensB.has(t)) {
      sharedWeight += w;
      shared.push(t);
    }
  }

  return {
    score: totalWeight > 0 ? sharedWeight / totalWeight : 0,
    shared,
  };
}

function computeTriggerOverlap(
  triggersA: string[],
  triggersB: string[]
): { score: number; shared: string[] } {
  if (triggersA.length === 0 && triggersB.length === 0) {
    return { score: 0, shared: [] };
  }

  const shared: string[] = [];

  // Check for exact phrase matches
  const setA = new Set(triggersA.map((t) => t.toLowerCase()));
  const setB = new Set(triggersB.map((t) => t.toLowerCase()));

  for (const t of setA) {
    if (setB.has(t)) shared.push(t);
  }

  // Check for word-level overlap between trigger phrases
  const wordsA = new Set(triggersA.flatMap((t) => tokenize(t)));
  const wordsB = new Set(triggersB.flatMap((t) => tokenize(t)));

  let wordOverlap = 0;
  const allWords = new Set([...wordsA, ...wordsB]);
  for (const w of allWords) {
    if (wordsA.has(w) && wordsB.has(w)) wordOverlap++;
  }

  const totalTriggers = setA.size + setB.size;
  const exactScore = totalTriggers > 0 ? (shared.length * 2) / totalTriggers : 0;
  const wordScore = allWords.size > 0 ? wordOverlap / allWords.size : 0;

  return {
    score: Math.max(exactScore, wordScore),
    shared,
  };
}

function computeBigramOverlap(
  skillA: SkillForCollision,
  skillB: SkillForCollision
): number {
  const tokensA = tokenize(`${skillA.description} ${skillA.trigger_phrases.join(" ")}`);
  const tokensB = tokenize(`${skillB.description} ${skillB.trigger_phrases.join(" ")}`);

  const bigramsA = toBigrams(tokensA);
  const bigramsB = toBigrams(tokensB);

  if (bigramsA.size === 0 && bigramsB.size === 0) return 0;

  let overlap = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) overlap++;
  }

  const union = new Set([...bigramsA, ...bigramsB]).size;
  return union > 0 ? overlap / union : 0;
}

// ── Weights ────────────────────────────────────────────────

const W_KEYWORD = 0.40;
const W_TRIGGER = 0.35;
const W_BIGRAM = 0.25;

// ── Main Analysis ──────────────────────────────────────────

/**
 * Analyze all skill pairs in a library for collisions.
 */
export function analyzeCollisions(
  skills: SkillForCollision[],
  libraryId: string = ""
): CollisionAnalysis {
  const idf = computeIDF(skills);
  const pairs: CollisionPair[] = [];

  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const a = skills[i];
      const b = skills[j];

      const tokensA = getTokenSet(a);
      const tokensB = getTokenSet(b);

      const kw = computeKeywordOverlap(tokensA, tokensB, idf);
      const tr = computeTriggerOverlap(a.trigger_phrases, b.trigger_phrases);
      const bg = computeBigramOverlap(a, b);

      const overlapPct = Math.round(
        (W_KEYWORD * kw.score + W_TRIGGER * tr.score + W_BIGRAM * bg) * 100
      );

      const severity = classifySeverity(overlapPct);

      pairs.push({
        skill_a: a.name,
        skill_b: b.name,
        overlap_pct: overlapPct,
        shared_keywords: kw.shared,
        shared_triggers: tr.shared,
        severity,
        keyword_overlap: Math.round(kw.score * 100),
        trigger_overlap: Math.round(tr.score * 100),
        bigram_overlap: Math.round(bg * 100),
        recommendation: recommendAction(severity, { skill_a: a.name, skill_b: b.name }),
      });
    }
  }

  // Sort by overlap descending
  pairs.sort((a, b) => b.overlap_pct - a.overlap_pct);

  const critical = pairs.filter((p) => p.severity === "CRITICAL").length;
  const high = pairs.filter((p) => p.severity === "HIGH").length;
  const medium = pairs.filter((p) => p.severity === "MEDIUM").length;
  const low = pairs.filter((p) => p.overlap_pct > 0 && p.severity === "LOW").length;
  const clean = pairs.filter((p) => p.overlap_pct === 0).length;

  // Overall collision score: 0 = no collisions, 100 = everything collides
  const totalPairs = pairs.length;
  const overallScore = totalPairs > 0
    ? Math.round(pairs.reduce((sum, p) => sum + p.overlap_pct, 0) / totalPairs)
    : 0;

  return {
    library_id: libraryId,
    total_pairs: totalPairs,
    collision_pairs: pairs,
    critical_count: critical,
    high_count: high,
    medium_count: medium,
    low_count: low,
    clean_count: clean,
    overall_collision_score: overallScore,
  };
}
