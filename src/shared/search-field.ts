import type { FieldSearchOptions, FlowHit, ParsedFlow } from './types.js';

function fieldMatchesQuery(refObject: string | undefined, refField: string, options: FieldSearchOptions): boolean {
  if (refField !== options.fieldName) {
    return false;
  }
  if (!options.object) {
    return true;
  }
  if (!refObject) {
    return false;
  }
  return refObject === options.object;
}

export function searchFieldInFlow(flow: ParsedFlow, options: FieldSearchOptions): FlowHit[] {
  const hits: FlowHit[] = [];
  for (const ref of flow.fieldRefs) {
    if (!fieldMatchesQuery(ref.object, ref.field, options)) {
      continue;
    }
    hits.push({
      flow: flow.apiName,
      flowLabel: flow.label,
      filePath: flow.filePath,
      node: ref.nodeName,
      nodeType: ref.nodeType,
      nodeLabel: ref.nodeLabel,
      usage: ref.usage,
      detail: ref.detail,
      field: ref.field,
      object: ref.object,
    });
  }
  return hits;
}

export function searchFieldInFlows(flows: ParsedFlow[], options: FieldSearchOptions): FlowHit[] {
  return flows.flatMap((flow) => searchFieldInFlow(flow, options));
}