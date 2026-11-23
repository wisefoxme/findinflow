import { expect } from 'chai';
import type { ParsedFlow } from '../../src/shared/types.js';
import { searchFieldInFlow, searchFieldInFlows } from '../../src/shared/search-field.js';

describe('search-field', () => {
  const flow: ParsedFlow = {
    apiName: 'Demo',
    filePath: '/Demo.flow-meta.xml',
    fieldRefs: [
      {
        field: 'Status',
        object: 'Account',
        usage: 'read',
        detail: 'filter',
        nodeName: 'start',
        nodeType: 'start',
      },
      {
        field: 'Status',
        object: 'Case',
        usage: 'write',
        detail: 'inputAssignment',
        nodeName: 'Update_Case',
        nodeType: 'recordUpdates',
      },
    ],
    objectRefs: [],
  };

  it('filters by object when provided', () => {
    const hits = searchFieldInFlow(flow, { fieldName: 'Status', object: 'Account' });
    expect(hits).to.have.length(1);
    expect(hits[0].usage).to.equal('read');
  });

  it('returns all fields without object filter', () => {
    const hits = searchFieldInFlows([flow], { fieldName: 'Status' });
    expect(hits).to.have.length(2);
  });
});