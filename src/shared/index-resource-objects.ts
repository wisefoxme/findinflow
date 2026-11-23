import { indexVariables, type FlowDoc } from './parse-helpers.js';
import { asArray, textOf } from './xml-utils.js';

/** Merge SObject types from variables, record lookups, and record creates (variables win on name clash). */
export function indexResourceObjects(flow: FlowDoc): Map<string, string> {
  const map = indexVariables(flow);

  for (const lookup of asArray<FlowDoc>(flow.recordLookups)) {
    const name = textOf(lookup.name);
    const object = textOf(lookup.object);
    if (name && object && !map.has(name)) {
      map.set(name, object);
    }
  }

  for (const create of asArray<FlowDoc>(flow.recordCreates)) {
    const name = textOf(create.name);
    const object = textOf(create.object);
    if (name && object && !map.has(name)) {
      map.set(name, object);
    }
  }

  return map;
}