/**
 * Optimization Proposer — generates description change proposals
 * to improve routing accuracy.
 *
 * Strategies:
 *   1. Add missing trigger phrases from failed test cases
 *   2. Remove ambiguous keywords shared with colliding skills
 *   3. Sharpen description to distinguish from closest competitor
 */

import { tokenize } from "./matcher";
import type { CaseResult } from "./scorer";

export type ChangeType =
  | "add_trigger_phrases"
  | "remove_ambiguous_keywords"
  | "sharpen_description";

export interface Proposal {
  skill_name: string;
  change_type: ChangeType;
  old_description: string;
  new_description: string;
  rationale: string;
}

export interface SkillForProposal {
  name: string;
  description: string;
  trigger_phrases: string[];
}

/**
 * Analyze failed cases and propose changes to improve routing.
 */
export function generateProposals(
  caseResults: CaseResult[],
  skills: SkillForProposal[],
  maxProposals: number = 5
): Proposal[] {
  const proposals: Proposal[] = [];
  const skillMap = new Map(skills.map((s) => [s.name, s]));

  // Group failures by expected skill
  const failuresBySkill = new Map<string, CaseResult[]>();
  for (const cr of caseResults) {
    if (cr.result_type !== "correct") {
      const existing = failuresBySkill.get(cr.expected_skill) || [];
      existing.push(cr);
      failuresBySkill.set(cr.expected_skill, existing);
    }
  }

  // Sort by most failures first
  const sortedSkills = Array.from(failuresBySkill.entries())
    .sort((a, b) => b[1].length - a[1].length);

  for (const [skillName, failures] of sortedSkills) {
    if (proposals.length >= maxProposals) break;

    const skill = skillMap.get(skillName);
    if (!skill) continue;

    // Strategy 1: Add trigger phrases from missed/wrong requests
    const missedRequests = failures
      .filter((f) => f.result_type === "miss" || f.result_type === "wrong")
      .map((f) => f.request_text);

    if (missedRequests.length > 0) {
      const proposal = proposeAddTriggers(skill, missedRequests);
      if (proposal) {
        proposals.push(proposal);
        if (proposals.length >= maxProposals) break;
      }
    }

    // Strategy 2: Remove ambiguous keywords for collision cases
    const collisions = failures.filter((f) => f.result_type === "collision");
    if (collisions.length > 0) {
      const competitorNames = collisions
        .map((f) => f.triggered_skill)
        .filter((n): n is string => n !== null);
      const competitors = competitorNames
        .map((n) => skillMap.get(n))
        .filter((s): s is SkillForProposal => s !== undefined);

      if (competitors.length > 0) {
        const proposal = proposeRemoveAmbiguous(skill, competitors);
        if (proposal) {
          proposals.push(proposal);
          if (proposals.length >= maxProposals) break;
        }
      }
    }

    // Strategy 3: Sharpen description against top competitor
    if (failures.length > 0) {
      const topCompetitor = findTopCompetitor(failures, skillMap);
      if (topCompetitor) {
        const proposal = proposeSharpen(skill, topCompetitor);
        if (proposal) {
          proposals.push(proposal);
        }
      }
    }
  }

  return proposals;
}

/**
 * Propose adding trigger phrases derived from failed request text.
 */
function proposeAddTriggers(
  skill: SkillForProposal,
  missedRequests: string[]
): Proposal | null {
  const existingTriggerTokens = new Set(
    skill.trigger_phrases.flatMap((t) => tokenize(t))
  );
  const descTokens = new Set(tokenize(skill.description));

  // Extract key phrases from missed requests that aren't in current triggers
  const newPhrases: string[] = [];
  for (const req of missedRequests) {
    const reqTokens = tokenize(req);
    const novel = reqTokens.filter(
      (t) => !existingTriggerTokens.has(t) && !descTokens.has(t)
    );
    if (novel.length > 0) {
      // Add the most distinctive words to description
      newPhrases.push(...novel.slice(0, 3));
    }
  }

  if (newPhrases.length === 0) return null;

  const uniquePhrases = [...new Set(newPhrases)].slice(0, 5);
  const addition = uniquePhrases.join(", ");

  return {
    skill_name: skill.name,
    change_type: "add_trigger_phrases",
    old_description: skill.description,
    new_description: `${skill.description}. Also handles: ${addition}`,
    rationale: `Skill missed ${missedRequests.length} request(s). Adding keywords: ${addition}`,
  };
}

/**
 * Propose removing ambiguous keywords shared with a competitor.
 */
function proposeRemoveAmbiguous(
  skill: SkillForProposal,
  competitors: SkillForProposal[]
): Proposal | null {
  const skillTokens = new Set(tokenize(skill.description));
  const competitorTokens = new Set(
    competitors.flatMap((c) => tokenize(c.description))
  );

  const shared = [...skillTokens].filter((t) => competitorTokens.has(t));
  if (shared.length === 0) return null;

  // Remove the most generic shared words (keep skill-specific ones)
  const toRemove = shared.slice(0, 3);
  let newDesc = skill.description;
  for (const word of toRemove) {
    // Replace word with empty, clean up whitespace
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    newDesc = newDesc.replace(regex, "").replace(/\s+/g, " ").trim();
  }

  // Clean up artifacts
  newDesc = newDesc.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();

  if (newDesc === skill.description || newDesc.length < 10) return null;

  return {
    skill_name: skill.name,
    change_type: "remove_ambiguous_keywords",
    old_description: skill.description,
    new_description: newDesc,
    rationale: `Removing ambiguous keywords shared with ${competitors.map((c) => c.name).join(", ")}: ${toRemove.join(", ")}`,
  };
}

/**
 * Propose sharpening the description to distinguish from competitor.
 */
function proposeSharpen(
  skill: SkillForProposal,
  competitor: SkillForProposal
): Proposal | null {
  const skillTokens = tokenize(skill.description);
  const competitorTokens = new Set(tokenize(competitor.description));

  // Find unique tokens in skill's description
  const unique = skillTokens.filter((t) => !competitorTokens.has(t));
  if (unique.length === 0) return null;

  // Emphasize unique aspects by prepending them
  const emphasis = unique.slice(0, 3).join(", ");
  const newDesc = `Specifically for ${emphasis}. ${skill.description}`;

  return {
    skill_name: skill.name,
    change_type: "sharpen_description",
    old_description: skill.description,
    new_description: newDesc,
    rationale: `Sharpening against "${competitor.name}" by emphasizing unique aspects: ${emphasis}`,
  };
}

/**
 * Find the skill that most often beats the expected skill.
 */
function findTopCompetitor(
  failures: CaseResult[],
  skillMap: Map<string, SkillForProposal>
): SkillForProposal | null {
  const counts = new Map<string, number>();
  for (const f of failures) {
    if (f.triggered_skill && f.triggered_skill !== f.expected_skill) {
      counts.set(f.triggered_skill, (counts.get(f.triggered_skill) || 0) + 1);
    }
  }

  if (counts.size === 0) return null;

  const topName = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return skillMap.get(topName) || null;
}
