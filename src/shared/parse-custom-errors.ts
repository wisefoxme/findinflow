import { addField, nodeMeta, type FlowDoc } from './parse-helpers.js';
import type { FieldReference } from './types.js';
import { asArray, textOf } from './xml-utils.js';

export function parseCustomErrors(
  flow: FlowDoc,
  recordObject: string | undefined,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.customErrors)) {
    const meta = nodeMeta(node);
    for (const message of asArray<FlowDoc>(node.customErrorMessages)) {
      const fieldName = textOf(message.fieldSelection);
      if (fieldName) {
        addField(fieldRefs, {
          ...meta,
          nodeType: 'customErrors',
          field: fieldName,
          object: recordObject,
          usage: 'write',
          detail: 'customError.fieldSelection',
        });
      }
    }
  }
}