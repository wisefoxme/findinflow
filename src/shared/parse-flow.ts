import { basename } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { parseElementReference } from './ref-parse.js';
import { parseActionCalls } from './parse-action-calls.js';
import { parseCollectionProcessors } from './parse-collection-processors.js';
import { parseCustomErrors } from './parse-custom-errors.js';
import { parseLoops } from './parse-loops.js';
import {
  addField,
  addObject,
  collectFieldFromRef,
  elementRefFromValue,
  nodeMeta,
  parseRecordObject,
  scanRecordFieldExpression,
  type FlowDoc,
} from './parse-helpers.js';
import { indexResourceObjects } from './index-resource-objects.js';
import { parseDecisions } from './parse-decisions.js';
import { parseScreens } from './parse-screens.js';
import { parseSubflows } from './parse-subflows.js';
import type { FieldReference, ObjectReference, ParsedFlow } from './types.js';
import { asArray, flowXmlArrayTags, textOf } from './xml-utils.js';

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

function parseDmlNodes(
  nodeType: string,
  nodes: FlowDoc[],
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
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
        variableObjects,
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
        variableObjects,
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
    scanRecordFieldExpression(
      fieldRefs,
      expression,
      'formulas',
      meta,
      recordObject,
      variableObjects,
      'formula.expression',
    );
  }
}

function parseStart(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
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
    const filterFormula = textOf(start.filterFormula);
    if (filterFormula) {
      scanRecordFieldExpression(
        fieldRefs,
        filterFormula,
        'start',
        meta,
        object ?? recordObject,
        variableObjects,
        'start.filterFormula',
      );
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
  const variableObjects = indexResourceObjects(flow);
  const recordObject = parseRecordObject(flow);
  const fieldRefs: FieldReference[] = [];
  const objectRefs: ObjectReference[] = [];

  parseStart(flow, recordObject, variableObjects, fieldRefs, objectRefs);
  parseVariables(flow, objectRefs);
  parseAssignments(flow, recordObject, variableObjects, fieldRefs);
  parseFormulas(flow, recordObject, variableObjects, fieldRefs);
  parseDecisions(flow, recordObject, variableObjects, fieldRefs);
  parseActionCalls(flow, recordObject, variableObjects, fieldRefs, objectRefs);
  parseScreens(flow, recordObject, variableObjects, fieldRefs, objectRefs);
  parseSubflows(flow, recordObject, variableObjects, fieldRefs);
  parseCollectionProcessors(flow, recordObject, variableObjects, fieldRefs);
  parseLoops(flow, recordObject, variableObjects, fieldRefs);
  parseCustomErrors(flow, recordObject, fieldRefs);
  parseDmlNodes('recordCreates', asArray(flow.recordCreates), recordObject, variableObjects, fieldRefs, objectRefs);
  parseDmlNodes('recordUpdates', asArray(flow.recordUpdates), recordObject, variableObjects, fieldRefs, objectRefs);
  parseDmlNodes('recordLookups', asArray(flow.recordLookups), recordObject, variableObjects, fieldRefs, objectRefs);
  parseDmlNodes('recordDeletes', asArray(flow.recordDeletes), recordObject, variableObjects, fieldRefs, objectRefs);

  return {
    apiName: flowApiNameFromPath(filePath),
    label: textOf(flow.label),
    filePath,
    recordObject,
    fieldRefs,
    objectRefs,
  };
}