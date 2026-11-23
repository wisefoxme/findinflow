import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from 'chai';
import { parseFlowFile } from '../../src/shared/parse-flow.js';
import { searchFieldInFlow } from '../../src/shared/search-field.js';
import { searchObjectInFlow } from '../../src/shared/search-object.js';

const fixtures = join(process.cwd(), 'test/fixtures');

async function loadFixture(name: string): Promise<string> {
  return readFile(join(fixtures, name), 'utf8');
}

describe('parse-flow', () => {
  it('finds DOB write and PersonBirthdate reads', async () => {
    const content = await loadFixture('dob-assignment.flow-meta.xml');
    const flow = parseFlowFile(content, join(fixtures, 'DOB_Birthdate.flow-meta.xml'));
    const dobHits = searchFieldInFlow(flow, { fieldName: 'DOB__c', object: 'Account' });
    expect(dobHits.some((h) => h.usage === 'write' && h.detail === 'assignToReference')).to.equal(true);

    const birthHits = searchFieldInFlow(flow, { fieldName: 'PersonBirthdate', object: 'Account' });
    expect(birthHits.length).to.be.greaterThan(0);
  });

  it('finds formula read on SObject variable field', async () => {
    const content = await loadFixture('validate-referral.flow-meta.xml');
    const flow = parseFlowFile(content, join(fixtures, 'Validate_Referral_Account.flow-meta.xml'));
    const hits = searchFieldInFlow(flow, { fieldName: 'FirstName', object: 'Account' });
    expect(hits.some((h) => h.nodeType === 'formulas')).to.equal(true);
    expect(searchObjectInFlow(flow, { objectName: 'Account' }).length).to.be.greaterThan(0);
  });

  it('finds read and write on same field in record update', async () => {
    const content = await loadFixture('record-update.flow-meta.xml');
    const flow = parseFlowFile(content, join(fixtures, 'Referral_Stage_History.flow-meta.xml'));
    const hits = searchFieldInFlow(flow, { fieldName: 'Time_Completed__c', object: 'Referral_Stage_History__c' });
    expect(hits.some((h) => h.usage === 'read')).to.equal(true);
    expect(hits.some((h) => h.usage === 'write')).to.equal(true);
  });

  it('indexes lookup object and Id filter', async () => {
    const content = await loadFixture('lookup.flow-meta.xml');
    const flow = parseFlowFile(content, join(fixtures, 'Lookup_Sample.flow-meta.xml'));
    expect(searchObjectInFlow(flow, { objectName: 'Account' }).length).to.be.greaterThan(0);
    const idHits = searchFieldInFlow(flow, { fieldName: 'Id', object: 'Account' });
    expect(idHits.some((h) => h.detail === 'filter')).to.equal(true);
  });
});