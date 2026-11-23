import type { FlowHit, ObjectSearchOptions, ParsedFlow } from './types.js';

export function searchObjectInFlow(flow: ParsedFlow, options: ObjectSearchOptions): FlowHit[] {
  const hits: FlowHit[] = [];
  for (const ref of flow.objectRefs) {
    if (ref.object !== options.objectName) {
      continue;
    }
    hits.push({
      flow: flow.apiName,
      flowLabel: flow.label,
      filePath: flow.filePath,
      node: ref.nodeName,
      nodeType: ref.nodeType,
      nodeLabel: ref.nodeLabel,
      usage: 'reference',
      detail: ref.detail,
      object: ref.object,
    });
  }
  return hits;
}

export function searchObjectInFlows(flows: ParsedFlow[], options: ObjectSearchOptions): FlowHit[] {
  return flows.flatMap((flow) => searchObjectInFlow(flow, options));
}