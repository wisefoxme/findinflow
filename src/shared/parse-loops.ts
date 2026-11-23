import { collectFieldFromRef, nodeMeta, type FlowDoc } from './parse-helpers.js';
import type { FieldReference } from './types.js';
import { asArray, textOf } from './xml-utils.js';

export function parseLoops(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.loops)) {
    const meta = nodeMeta(node);
    const collectionRef = textOf(node.collectionReference);
    if (collectionRef) {
      collectFieldFromRef(
        fieldRefs,
        collectionRef,
        'read',
        'loop.collectionReference',
        'loops',
        meta,
        recordObject,
        variableObjects,
      );
    }
  }
}