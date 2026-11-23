import { readFile } from 'node:fs/promises';
import { discoverFlowFiles } from './discover-flows.js';
import { parseFlowFile } from './parse-flow.js';
import type { DiscoverFlowsOptions, ParsedFlow } from './types.js';

export async function loadParsedFlows(options: DiscoverFlowsOptions): Promise<ParsedFlow[]> {
  const files = await discoverFlowFiles(options);
  return Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, 'utf8');
      return parseFlowFile(content, filePath);
    }),
  );
}