import { collectFieldFromRef, elementRefFromValue, nodeMeta, type FlowDoc } from './parse-helpers.js';
import type { FieldReference } from './types.js';
import { asArray } from './xml-utils.js';

export function parseSubflows(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.subflows)) {
    const meta = nodeMeta(node);
    for (const assignment of asArray<FlowDoc>(node.inputAssignments)) {
      const ref = elementRefFromValue(assignment.value);
      collectFieldFromRef(
        fieldRefs,
        ref,
        'read',
        'subflow.inputAssignment',
        'subflows',
        meta,
        recordObject,
        variableObjects,
      );
    }
  }
}