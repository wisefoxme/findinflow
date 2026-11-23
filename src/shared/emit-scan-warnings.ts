import { Messages } from '@salesforce/core';
import type { FlowScanMeta } from './discover-flow-scan-meta.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('findinflow', 'findinflow.scan');

export type ScanWarningSink = {
  warn: (message: string) => void;
};

export function emitScanWarnings(command: ScanWarningSink, meta: FlowScanMeta): void {
  if (meta.singleFileScope) {
    return;
  }

  command.warn(messages.getMessage('warnings.localMetadataOnly'));

  if (meta.excludedCount > 0) {
    const sample = meta.excludedSampleRelativePaths.join(', ');
    command.warn(messages.getMessage('warnings.flowsOutsidePackageDirectories', [String(meta.excludedCount), sample]));
  }
}