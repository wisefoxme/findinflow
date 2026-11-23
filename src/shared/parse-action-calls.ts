import {
  addField,
  addObject,
  collectFieldFromRef,
  elementRefFromValue,
  nodeMeta,
  stringValueFrom,
  type FlowDoc,
} from './parse-helpers.js';
import { parseElementReference } from './ref-parse.js';
import type { FieldReference, ObjectReference } from './types.js';
import { asArray, textOf } from './xml-utils.js';

export function parseActionCalls(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
  objectRefs: ObjectReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.actionCalls)) {
    const meta = nodeMeta(node);
    for (const param of asArray<FlowDoc>(node.inputParameters)) {
      const paramName = textOf(param.name);
      const value = param.value;
      if (paramName === 'objectApiName') {
        const object = stringValueFrom(value);
        if (object) {
          addObject(objectRefs, {
            ...meta,
            nodeType: 'actionCalls',
            object,
            detail: 'actionCall.inputParameters.objectApiName',
          });
        }
      }
      const ref = elementRefFromValue(value);
      collectFieldFromRef(
        fieldRefs,
        ref,
        'read',
        'actionCall.inputParameters.elementReference',
        'actionCalls',
        meta,
        recordObject,
        variableObjects,
      );
    }
    for (const output of asArray<FlowDoc>(node.outputParameters)) {
      const assignTo = textOf(output.assignToReference);
      if (assignTo) {
        const parsed = parseElementReference(assignTo, recordObject, variableObjects);
        if (parsed.field) {
          addField(fieldRefs, {
            ...meta,
            nodeType: 'actionCalls',
            field: parsed.field,
            object: parsed.object,
            usage: 'write',
            detail: 'actionCall.outputParameter',
          });
        }
      }
    }
  }
}