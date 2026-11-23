import { indexConditionFields } from './parse-conditions.js';
import { nodeMeta, type FlowDoc } from './parse-helpers.js';
import type { FieldReference } from './types.js';
import { asArray } from './xml-utils.js';

export function parseDecisions(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.decisions)) {
    const meta = nodeMeta(node);
    for (const rule of asArray<FlowDoc>(node.rules)) {
      for (const condition of asArray<FlowDoc>(rule.conditions)) {
        indexConditionFields(
          condition,
          fieldRefs,
          meta,
          'decisions',
          recordObject,
          variableObjects,
          'decision.condition',
        );
      }
    }
  }
}