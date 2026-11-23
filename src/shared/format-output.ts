import type { FlowHit } from './types.js';

export type TableRow = {
  Flow: string;
  Node: string;
  NodeType: string;
  Usage: string;
  Detail: string;
  Field: string;
  Object: string;
};

export function hitsToTableRows(hits: FlowHit[]): TableRow[] {
  return hits.map((hit) => ({
    Flow: hit.flow,
    Node: hit.node,
    NodeType: hit.nodeType,
    Usage: hit.usage,
    Detail: hit.detail,
    Field: hit.field ?? '',
    Object: hit.object ?? '',
  }));
}

export function sortHits(hits: FlowHit[]): FlowHit[] {
  return [...hits].sort((a, b) => {
    const flowCmp = a.flow.localeCompare(b.flow);
    if (flowCmp !== 0) {
      return flowCmp;
    }
    const nodeCmp = a.node.localeCompare(b.node);
    if (nodeCmp !== 0) {
      return nodeCmp;
    }
    return a.detail.localeCompare(b.detail);
  });
}