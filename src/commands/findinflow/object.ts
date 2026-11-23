import { Messages, SfError } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { hitsToTableRows, sortHits } from '../../shared/format-output.js';
import { emitScanWarnings } from '../../shared/emit-scan-warnings.js';
import { loadFlowScanContext } from '../../shared/run-scan.js';
import { searchObjectInFlows } from '../../shared/search-object.js';
import { flowScopeFlags } from '../../shared/shared-flags.js';
import type { FlowHit } from '../../shared/types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('findinflow', 'findinflow.object');

export type ObjectResult = {
  hits: FlowHit[];
  flowsScanned: number;
};

export default class FindinflowObject extends SfCommand<ObjectResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    ...SfCommand.baseFlags,
    ...flowScopeFlags,
    name: Flags.string({
      char: 'n',
      required: true,
      summary: messages.getMessage('flags.name.summary'),
    }),
  };

  public async run(): Promise<ObjectResult> {
    const { flags } = await this.parse(FindinflowObject);
    if (flags.flow && flags['flow-regexp']) {
      throw new SfError(messages.getMessage('errors.flowFlagsExclusive'), 'ConflictingFlags');
    }

    const { flows, meta } = await loadFlowScanContext({
      projectDir: flags['project-dir'],
      flow: flags.flow,
      flowRegexp: flags['flow-regexp'],
    });

    emitScanWarnings(this, meta);

    if (flows.length === 0) {
      this.warn(messages.getMessage('warnings.noFlows'));
    }

    const hits = sortHits(
      searchObjectInFlows(flows, {
        objectName: flags.name,
      }),
    );

    const result: ObjectResult = { hits, flowsScanned: flows.length };

    if (!this.jsonEnabled()) {
      if (hits.length === 0) {
        this.log(messages.getMessage('info.noMatches'));
      } else {
        this.table({
          data: hitsToTableRows(hits),
          columns: [
            { key: 'Flow' },
            { key: 'Node' },
            { key: 'NodeType' },
            { key: 'Usage' },
            { key: 'Detail' },
            { key: 'Object' },
          ],
        });
      }
      this.log(messages.getMessage('info.summary', [String(hits.length), String(flows.length)]));
    }

    return result;
  }
}