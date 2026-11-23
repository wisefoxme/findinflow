import { addField, addObject, collectFieldFromRef, nodeMeta, stringValueFrom, type FlowDoc } from './parse-helpers.js';
import { parseElementReference } from './ref-parse.js';
import type { FieldReference, ObjectReference } from './types.js';
import { asArray, textOf } from './xml-utils.js';
import { walkScreenFields } from './walk-screen-fields.js';

export function parseScreens(
  flow: FlowDoc,
  recordObject: string | undefined,
  variableObjects: Map<string, string>,
  fieldRefs: FieldReference[],
  objectRefs: ObjectReference[],
): void {
  for (const screen of asArray<FlowDoc>(flow.screens)) {
    const meta = nodeMeta(screen);
    walkScreenFields(screen.fields, (field) => {
      const objectFieldRef = textOf(field.objectFieldReference);
      if (objectFieldRef) {
        const parsed = parseElementReference(objectFieldRef, recordObject, variableObjects);
        if (parsed.field) {
          addField(fieldRefs, {
            ...meta,
            nodeType: 'screens',
            field: parsed.field,
            object: parsed.object,
            usage: 'write',
            detail: 'screen.objectFieldReference',
          });
        }
      }

      const params = asArray<FlowDoc>(field.inputParameters);
      const objectApiName = params
        .map((param) => (textOf(param.name) === 'objectApiName' ? stringValueFrom(param.value) : undefined))
        .find((v) => v !== undefined);
      if (objectApiName) {
        addObject(objectRefs, {
          ...meta,
          nodeType: 'screens',
          object: objectApiName,
          detail: 'screen.component.objectApiName',
        });
      }
      for (const param of params) {
        const paramName = textOf(param.name);
        const value = param.value;
        if (paramName === 'fieldApiName') {
          const fieldApi = stringValueFrom(value);
          if (fieldApi) {
            addField(fieldRefs, {
              ...meta,
              nodeType: 'screens',
              field: fieldApi,
              object: objectApiName,
              usage: 'read',
              detail: 'screen.component.fieldApiName',
            });
          }
        }
        const ref =
          typeof value === 'object' && value !== null && 'elementReference' in value
            ? textOf((value as FlowDoc).elementReference)
            : undefined;
        collectFieldFromRef(
          fieldRefs,
          ref,
          'read',
          'screen.component.elementReference',
          'screens',
          meta,
          recordObject,
          variableObjects,
        );
      }
    });
  }
}