import { readFile } from 'node:fs/promises';
import { discoverFlowFiles } from './discover-flows.js';
import { discoverFlowScanMeta, type FlowScanMeta } from './discover-flow-scan-meta.js';
import { parseFlowFile } from './parse-flow.js';
import type { DiscoverFlowsOptions, ParsedFlow } from './types.js';

export type FlowScanContext = {
  meta: FlowScanMeta;
  flows: ParsedFlow[];
};

export async function loadFlowScanContext(options: DiscoverFlowsOptions): Promise<FlowScanContext> {
  const [files, meta] = await Promise.all([discoverFlowFiles(options), discoverFlowScanMeta(options)]);
  const flows = await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, 'utf8');
      return parseFlowFile(content, filePath);
    }),
  );
  return { meta, flows };
}

export async function loadParsedFlows(options: DiscoverFlowsOptions): Promise<ParsedFlow[]> {
  const { flows } = await loadFlowScanContext(options);
  return flows;
}