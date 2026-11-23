import { indexConditionFields } from './parse-conditions.js';
import { nodeMeta, type FlowDoc } from './parse-helpers.js';
import type { FieldReference } from './types.js';
import { asArray } from './xml-utils.js';

export function parseCollectionProcessors(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.collectionProcessors)) {
    const meta = nodeMeta(node);
    for (const condition of asArray<FlowDoc>(node.conditions)) {
      indexConditionFields(
        condition,
        fieldRefs,
        meta,
        'collectionProcessors',
        recordObject,
        variableObjects,
        'collectionProcessor.condition',
      );
    }
  }
}