import { expandReadPath, formulaReferences, parseElementReference } from './ref-parse.js';
import type { FieldReference, ObjectReference } from './types.js';
import { asArray, textOf } from './xml-utils.js';

export type FlowDoc = Record<string, unknown>;

export function elementRefFromValue(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'elementReference' in value) {
    return textOf((value as FlowDoc).elementReference);
  }
  return undefined;
}

export function stringValueFrom(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'stringValue' in value) {
    return textOf((value as FlowDoc).stringValue);
  }
  return undefined;
}

export function nodeMeta(node: FlowDoc): { nodeName: string; nodeLabel?: string } {
  return {
    nodeName: textOf(node.name) ?? 'unknown',
    nodeLabel: textOf(node.label),
  };
}

export function addField(
  refs: FieldReference[],
  args: Omit<FieldReference, 'field' | 'object' | 'usage' | 'detail'> & {
    field: string;
    object?: string;
    usage: FieldReference['usage'];
    detail: string;
  },
): void {
  refs.push({
    field: args.field,
    object: args.object,
    usage: args.usage,
    detail: args.detail,
    nodeName: args.nodeName,
    nodeType: args.nodeType,
    nodeLabel: args.nodeLabel,
  });
}

export function addObject(
  refs: ObjectReference[],
  args: Omit<ObjectReference, 'object' | 'detail'> & { object: string; detail: string },
): void {
  refs.push({
    object: args.object,
    detail: args.detail,
    nodeName: args.nodeName,
    nodeType: args.nodeType,
    nodeLabel: args.nodeLabel,
  });
}

export function collectFieldFromRef(
  refs: FieldReference[],
  ref: string | undefined,
  usage: FieldReference['usage'],
  detail: string,
  nodeType: string,
  meta: { nodeName: string; nodeLabel?: string },
  recordObject: string | undefined,
  variableObjects: ReadonlyMap<string, string>,
): void {
  if (!ref) {
    return;
  }

  if (usage === 'write') {
    const parsed = parseElementReference(ref, recordObject, variableObjects);
    if (!parsed.field) {
      return;
    }
    addField(refs, {
      ...meta,
      nodeType,
      field: parsed.field,
      object: parsed.object,
      usage,
      detail,
    });
    return;
  }

  const segments = expandReadPath(ref, recordObject, variableObjects);
  if (segments.length === 0) {
    return;
  }
  const sobjectOnly = segments.length === 1 && segments[0].field === 'Id' && !ref.trim().includes('.');
  segments.forEach((segment, index) => {
    const segmentDetail =
      index === 0 && !sobjectOnly
        ? detail
        : sobjectOnly
          ? `${detail}.sobjectId`
          : `${detail}.pathSegment`;
    addField(refs, {
      ...meta,
      nodeType,
      field: segment.field,
      object: segment.object,
      usage,
      detail: segmentDetail,
    });
  });
}

export function indexVariables(flow: FlowDoc): Map<string, string> {
  const map = new Map<string, string>();
  for (const variable of asArray<FlowDoc>(flow.variables)) {
    const name = textOf(variable.name);
    const objectType = textOf(variable.objectType);
    if (name && objectType) {
      map.set(name, objectType);
    }
  }
  return map;
}

export function parseRecordObject(flow: FlowDoc): string | undefined {
  for (const start of asArray<FlowDoc>(flow.start)) {
    const object = textOf(start.object);
    if (object) {
      return object;
    }
  }
  return undefined;
}

export function scanRecordFieldExpression(
  refs: FieldReference[],
  expression: string,
  nodeType: string,
  meta: { nodeName: string; nodeLabel?: string },
  recordObject: string | undefined,
  variableObjects: ReadonlyMap<string, string>,
  detail: string,
): void {
  for (const ref of formulaReferences(expression)) {
    collectFieldFromRef(refs, ref, 'read', detail, nodeType, meta, recordObject, variableObjects);
  }
  const bareRecordPath = /\$Record(?:\.[A-Za-z0-9_]+)+/g;
  let match: RegExpExecArray | null;
  while ((match = bareRecordPath.exec(expression)) !== null) {
    const segments = expandReadPath(match[0], recordObject, variableObjects);
    segments.forEach((segment, index) => {
      addField(refs, {
        ...meta,
        nodeType,
        field: segment.field,
        object: segment.object,
        usage: 'read',
        detail: index === 0 ? detail : `${detail}.pathSegment`,
      });
    });
  }
}