import { expect } from 'chai';
import type { ParsedFlow } from '../../src/shared/types.js';
import { searchObjectInFlow, searchObjectInFlows } from '../../src/shared/search-object.js';

describe('search-object', () => {
  const flow: ParsedFlow = {
    apiName: 'Demo',
    filePath: '/Demo.flow-meta.xml',
    fieldRefs: [],
    objectRefs: [
      {
        object: 'Account',
        detail: 'object',
        nodeName: 'Get_Patient',
        nodeType: 'recordLookups',
      },
    ],
  };

  it('matches object references', () => {
    expect(searchObjectInFlow(flow, { objectName: 'Account' })).to.have.length(1);
    expect(searchObjectInFlow(flow, { objectName: 'Case' })).to.have.length(0);
    expect(searchObjectInFlows([flow], { objectName: 'Account' })).to.have.length(1);
  });
});