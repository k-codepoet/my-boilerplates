import type { RuleExpression, GameRules } from "./types";
import type { GameState } from "./GameState";

function compare(
  actual: unknown,
  operator: RuleExpression["operator"],
  expected: RuleExpression["value"],
): boolean {
  switch (operator) {
    case "eq":
      return actual === expected;
    case "gt":
      return (actual as number) > (expected as number);
    case "lt":
      return (actual as number) < (expected as number);
    case "gte":
      return (actual as number) >= (expected as number);
    case "lte":
      return (actual as number) <= (expected as number);
  }
}

export function evaluateRule(
  rule: RuleExpression,
  state: GameState,
): boolean {
  const value = state.get(rule.field);
  return compare(value, rule.operator, rule.value);
}

export function checkWin(rules: GameRules, state: GameState): boolean {
  return evaluateRule(rules.winCondition, state);
}

export function checkLose(rules: GameRules, state: GameState): boolean {
  return evaluateRule(rules.loseCondition, state);
}
