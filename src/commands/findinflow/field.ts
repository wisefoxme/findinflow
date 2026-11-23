import { Messages, SfError } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { hitsToTableRows, sortHits } from '../../shared/format-output.js';
import { loadParsedFlows } from '../../shared/run-scan.js';
import { searchFieldInFlows } from '../../shared/search-field.js';
import { flowScopeFlags } from '../../shared/shared-flags.js';
import type { FlowHit } from '../../shared/types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('plugin-findinflow', 'findinflow.field');

export type FieldResult = {
  hits: FlowHit[];
  flowsScanned: number;
};

export default class FindinflowField extends SfCommand<FieldResult> {
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
    object: Flags.string({
      summary: messages.getMessage('flags.object.summary'),
    }),
  };

  public async run(): Promise<FieldResult> {
    const { flags } = await this.parse(FindinflowField);
    if (flags.flow && flags['flow-regexp']) {
      throw new SfError(messages.getMessage('errors.flowFlagsExclusive'), 'ConflictingFlags');
    }

    const flows = await loadParsedFlows({
      projectDir: flags['project-dir'],
      flow: flags.flow,
      flowRegexp: flags['flow-regexp'],
    });

    if (flows.length === 0) {
      this.warn(messages.getMessage('warnings.noFlows'));
    }

    const hits = sortHits(
      searchFieldInFlows(flows, {
        fieldName: flags.name,
        object: flags.object,
      }),
    );

    const result: FieldResult = { hits, flowsScanned: flows.length };

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
            { key: 'Field' },
          ],
        });
      }
      this.log(messages.getMessage('info.summary', [String(hits.length), String(flows.length)]));
    }

    return result;
  }
}