import { collectFieldFromRef, elementRefFromValue, type FlowDoc } from './parse-helpers.js';
import type { FieldReference } from './types.js';
import { textOf } from './xml-utils.js';

export function indexConditionFields(
  condition: FlowDoc,
  fieldRefs: FieldReference[],
  meta: { nodeName: string; nodeLabel?: string },
  nodeType: string,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  detailPrefix: string,
): void {
  const left = textOf(condition.leftValueReference);
  collectFieldFromRef(
    fieldRefs,
    left,
    'read',
    `${detailPrefix}.leftValueReference`,
    nodeType,
    meta,
    recordObject,
    variableObjects,
  );

  const rightRef = elementRefFromValue(condition.rightValue);
  collectFieldFromRef(
    fieldRefs,
    rightRef,
    'read',
    `${detailPrefix}.rightValue.elementReference`,
    nodeType,
    meta,
    recordObject,
    variableObjects,
  );
}