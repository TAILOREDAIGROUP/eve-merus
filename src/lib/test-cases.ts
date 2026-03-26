import type { TestCaseInput, Difficulty } from "@/types";

const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTestCase(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Input must be an object"] };
  }

  const tc = input as Record<string, unknown>;

  if (!tc.request_text || typeof tc.request_text !== "string") {
    errors.push("request_text is required and must be a string");
  }

  if (!tc.expected_skill || typeof tc.expected_skill !== "string") {
    errors.push("expected_skill is required and must be a string");
  }

  if (
    tc.expected_supporting !== undefined &&
    !Array.isArray(tc.expected_supporting)
  ) {
    errors.push("expected_supporting must be an array of strings");
  }

  if (
    tc.should_not_trigger !== undefined &&
    !Array.isArray(tc.should_not_trigger)
  ) {
    errors.push("should_not_trigger must be an array of strings");
  }

  if (
    tc.difficulty !== undefined &&
    !VALID_DIFFICULTIES.includes(tc.difficulty as Difficulty)
  ) {
    errors.push(
      `difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`
    );
  }

  if (tc.cluster_tag !== undefined && typeof tc.cluster_tag !== "string") {
    errors.push("cluster_tag must be a string");
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeTestCaseInput(input: TestCaseInput): TestCaseInput {
  return {
    request_text: input.request_text.trim(),
    expected_skill: input.expected_skill.trim(),
    expected_supporting: input.expected_supporting || [],
    should_not_trigger: input.should_not_trigger || [],
    difficulty: input.difficulty || "medium",
    cluster_tag: input.cluster_tag?.trim() || undefined,
  };
}

export function validateTestCaseBatch(
  inputs: unknown[]
): { valid: TestCaseInput[]; errors: { index: number; errors: string[] }[] } {
  const valid: TestCaseInput[] = [];
  const errors: { index: number; errors: string[] }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const result = validateTestCase(inputs[i]);
    if (result.valid) {
      valid.push(normalizeTestCaseInput(inputs[i] as TestCaseInput));
    } else {
      errors.push({ index: i, errors: result.errors });
    }
  }

  return { valid, errors };
}
