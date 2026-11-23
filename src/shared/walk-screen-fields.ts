import type { FlowDoc } from './parse-helpers.js';
import { asArray } from './xml-utils.js';

export type ScreenFieldVisit = (field: FlowDoc, ancestors: FlowDoc[]) => void;

/** Recursively visit every `fields` node under a screen (regions, columns, etc.). */
export function walkScreenFields(screenFields: unknown, visit: ScreenFieldVisit): void {
  walkFieldsRecursive(asArray<FlowDoc>(screenFields), visit, []);
}

function walkFieldsRecursive(nodes: FlowDoc[], visit: ScreenFieldVisit, ancestors: FlowDoc[]): void {
  for (const field of nodes) {
    visit(field, ancestors);
    const nested = asArray<FlowDoc>(field.fields);
    if (nested.length > 0) {
      walkFieldsRecursive(nested, visit, [...ancestors, field]);
    }
  }
}