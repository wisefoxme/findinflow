import { basename } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { formulaReferences, parseElementReference } from './ref-parse.js';
import type { FieldReference, ObjectReference, ParsedFlow } from './types.js';
import { asArray, flowXmlArrayTags, textOf } from './xml-utils.js';

type FlowDoc = Record<string, unknown>;

function flowApiNameFromPath(filePath: string): string {
  const base = basename(filePath);
  return base.endsWith('.flow-meta.xml') ? base.slice(0, -'.flow-meta.xml'.length) : base;
}

function buildParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    removeNSPrefix: true,
    isArray: (tagName) => flowXmlArrayTags.has(tagName),
  });
}

function elementRefFromValue(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'elementReference' in value) {
    return textOf((value as FlowDoc).elementReference);
  }
  return undefined;
}

function nodeMeta(node: FlowDoc): { nodeName: string; nodeLabel?: string } {
  return {
    nodeName: textOf(node.name) ?? 'unknown',
    nodeLabel: textOf(node.label),
  };
}

function addField(
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

function addObject(
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

function collectFieldFromRef(
  refs: FieldReference[],
  ref: string | undefined,
  usage: FieldReference['usage'],
  detail: string,
  nodeType: string,
  meta: { nodeName: string; nodeLabel?: string },
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
): void {
  if (!ref) {
    return;
  }
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
}

function indexVariables(flow: FlowDoc): Map<string, string> {
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

function parseRecordObject(flow: FlowDoc): string | undefined {
  for (const start of asArray<FlowDoc>(flow.start)) {
    const object = textOf(start.object);
    if (object) {
      return object;
    }
  }
  return undefined;
}

function parseDmlNodes(
  flow: FlowDoc,
  nodeType: string,
  nodes: FlowDoc[],
  recordObject: string | undefined,
  fieldRefs: FieldReference[],
  objectRefs: ObjectReference[],
): void {
  for (const node of nodes) {
    const meta = nodeMeta(node);
    const object = textOf(node.object);
    if (object) {
      addObject(objectRefs, { ...meta, nodeType, object, detail: 'object' });
    }

    for (const fieldName of asArray<string | FlowDoc>(node.queriedFields).map((f) => textOf(f) ?? '')) {
      if (fieldName) {
        addField(fieldRefs, {
          ...meta,
          nodeType,
          field: fieldName,
          object: object ?? recordObject,
          usage: 'read',
          detail: 'queriedFields',
        });
      }
    }

    const sortField = textOf(node.sortField);
    if (sortField) {
      addField(fieldRefs, {
        ...meta,
        nodeType,
        field: sortField,
        object: object ?? recordObject,
        usage: 'read',
        detail: 'sortField',
      });
    }

    for (const filter of asArray<FlowDoc>(node.filters)) {
      const fieldName = textOf(filter.field);
      if (fieldName) {
        addField(fieldRefs, {
          ...meta,
          nodeType,
          field: fieldName,
          object: object ?? recordObject,
          usage: 'read',
          detail: 'filter',
        });
      }
      const valueRef = elementRefFromValue(filter.value);
      collectFieldFromRef(
        fieldRefs,
        valueRef,
        'read',
        'filter.value.elementReference',
        nodeType,
        meta,
        recordObject,
        new Map(),
      );
    }

    for (const assignment of asArray<FlowDoc>(node.inputAssignments)) {
      const fieldName = textOf(assignment.field);
      if (fieldName) {
        addField(fieldRefs, {
          ...meta,
          nodeType,
          field: fieldName,
          object: object ?? recordObject,
          usage: 'write',
          detail: 'inputAssignment',
        });
      }
      const valueRef = elementRefFromValue(assignment.value);
      collectFieldFromRef(
        fieldRefs,
        valueRef,
        'read',
        'inputAssignment.value.elementReference',
        nodeType,
        meta,
        recordObject,
        new Map(),
      );
    }
  }
}

function parseAssignments(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.assignments)) {
    const meta = nodeMeta(node);
    for (const item of asArray<FlowDoc>(node.assignmentItems)) {
      const assignTo = textOf(item.assignToReference);
      if (assignTo) {
        const parsed = parseElementReference(assignTo, recordObject, variableObjects);
        if (parsed.field) {
          addField(fieldRefs, {
            ...meta,
            nodeType: 'assignments',
            field: parsed.field,
            object: parsed.object,
            usage: 'write',
            detail: 'assignToReference',
          });
        }
      }
      const valueRef = elementRefFromValue(item.value);
      collectFieldFromRef(
        fieldRefs,
        valueRef,
        'read',
        'assignmentItems.value.elementReference',
        'assignments',
        meta,
        recordObject,
        variableObjects,
      );
    }
  }
}

function parseFormulas(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.formulas)) {
    const meta = nodeMeta(node);
    const expression = textOf(node.expression);
    if (!expression) {
      continue;
    }
    for (const ref of formulaReferences(expression)) {
      collectFieldFromRef(
        fieldRefs,
        ref,
        'read',
        'formula.expression',
        'formulas',
        meta,
        recordObject,
        variableObjects,
      );
    }
    // Bare $Record.Field or TEXT(Month($Record.X)) patterns without braces
    const bareRecord = /\$Record\.([A-Za-z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = bareRecord.exec(expression)) !== null) {
      addField(fieldRefs, {
        ...meta,
        nodeType: 'formulas',
        field: match[1],
        object: recordObject,
        usage: 'read',
        detail: 'formula.expression',
      });
    }
  }
}

function parseDecisions(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
): void {
  for (const node of asArray<FlowDoc>(flow.decisions)) {
    const meta = nodeMeta(node);
    for (const rule of asArray<FlowDoc>(node.rules)) {
      for (const condition of asArray<FlowDoc>(rule.conditions)) {
        const left = textOf(condition.leftValueReference);
        collectFieldFromRef(
          fieldRefs,
          left,
          'read',
          'decision.condition.leftValueReference',
          'decisions',
          meta,
          recordObject,
          variableObjects,
        );
        const rightRef = elementRefFromValue(condition.rightValue);
        collectFieldFromRef(
          fieldRefs,
          rightRef,
          'read',
          'decision.condition.rightValue.elementReference',
          'decisions',
          meta,
          recordObject,
          variableObjects,
        );
      }
    }
  }
}

function parseStart(
  flow: FlowDoc,
  recordObject: string | undefined,
  fieldRefs: FieldReference[],
  objectRefs: ObjectReference[],
): void {
  for (const start of asArray<FlowDoc>(flow.start)) {
    const meta = { nodeName: 'start', nodeLabel: 'Start' };
    const object = textOf(start.object);
    if (object) {
      addObject(objectRefs, { ...meta, nodeType: 'start', object, detail: 'recordTrigger' });
    }
    for (const filter of asArray<FlowDoc>(start.filters)) {
      const fieldName = textOf(filter.field);
      if (fieldName) {
        addField(fieldRefs, {
          ...meta,
          nodeType: 'start',
          field: fieldName,
          object: object ?? recordObject,
          usage: 'read',
          detail: 'start.filter',
        });
      }
    }
  }
}

function parseVariables(flow: FlowDoc, objectRefs: ObjectReference[]): void {
  for (const variable of asArray<FlowDoc>(flow.variables)) {
    const meta = {
      nodeName: textOf(variable.name) ?? 'variable',
      nodeLabel: textOf(variable.description),
    };
    const objectType = textOf(variable.objectType);
    if (objectType) {
      addObject(objectRefs, {
        ...meta,
        nodeType: 'variables',
        object: objectType,
        detail: 'variable.objectType',
      });
    }
  }
}

export function parseFlowFile(content: string, filePath: string): ParsedFlow {
  const parser = buildParser();
  const doc = parser.parse(content) as { Flow?: FlowDoc };
  const flow = doc.Flow ?? {};
  const variableObjects = indexVariables(flow);
  const recordObject = parseRecordObject(flow);
  const fieldRefs: FieldReference[] = [];
  const objectRefs: ObjectReference[] = [];

  parseStart(flow, recordObject, fieldRefs, objectRefs);
  parseVariables(flow, objectRefs);
  parseAssignments(flow, recordObject, variableObjects, fieldRefs);
  parseFormulas(flow, recordObject, variableObjects, fieldRefs);
  parseDecisions(flow, recordObject, variableObjects, fieldRefs);
  parseDmlNodes(flow, 'recordCreates', asArray(flow.recordCreates), recordObject, fieldRefs, objectRefs);
  parseDmlNodes(flow, 'recordUpdates', asArray(flow.recordUpdates), recordObject, fieldRefs, objectRefs);
  parseDmlNodes(flow, 'recordLookups', asArray(flow.recordLookups), recordObject, fieldRefs, objectRefs);
  parseDmlNodes(flow, 'recordDeletes', asArray(flow.recordDeletes), recordObject, fieldRefs, objectRefs);

  return {
    apiName: flowApiNameFromPath(filePath),
    label: textOf(flow.label),
    filePath,
    recordObject,
    fieldRefs,
    objectRefs,
  };
}