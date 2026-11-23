import { expect } from 'chai';
import { hitsToTableRows, sortHits } from '../../src/shared/format-output.js';
import type { FlowHit } from '../../src/shared/types.js';

describe('format-output', () => {
  it('maps hits to table rows and sorts', () => {
    const hits: FlowHit[] = [
      {
        flow: 'B',
        filePath: '/b.xml',
        node: 'n1',
        nodeType: 'assignments',
        usage: 'write',
        detail: 'assignToReference',
        field: 'X',
      },
      {
        flow: 'A',
        filePath: '/a.xml',
        node: 'n2',
        nodeType: 'start',
        usage: 'read',
        detail: 'start.filter',
        field: 'Y',
        object: 'Account',
      },
    ];
    const sorted = sortHits(hits);
    expect(sorted[0].flow).to.equal('A');
    const rows = hitsToTableRows(sorted);
    expect(rows[0].Field).to.equal('Y');
    expect(rows[0].Object).to.equal('Account');

    const tieBreak: FlowHit[] = [
      { flow: 'A', filePath: '/a.xml', node: 'z', nodeType: 'start', usage: 'read', detail: 'b' },
      { flow: 'A', filePath: '/a.xml', node: 'a', nodeType: 'start', usage: 'read', detail: 'a' },
    ];
    expect(sortHits(tieBreak)[0].node).to.equal('a');
  });
});