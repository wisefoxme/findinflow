import { Flags } from '@salesforce/sf-plugins-core';

export const flowScopeFlags = {
  'project-dir': Flags.directory({
    summary: 'Salesforce DX project directory (defaults to cwd).',
    exists: true,
  }),
  flow: Flags.string({
    summary: 'Scan a single flow by API name or path to its .flow-meta.xml file.',
  }),
  'flow-regexp': Flags.string({
    summary: 'Regular expression applied to flow API names (filename without .flow-meta.xml).',
  }),
};