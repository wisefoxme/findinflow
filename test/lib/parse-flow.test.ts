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

  it('indexes actionCalls', async () => {
    const flow = parseFlowFile(await loadFixture('action-calls.flow-meta.xml'), join(fixtures, 'Action_Sample.flow-meta.xml'));
    expect(searchObjectInFlow(flow, { objectName: 'Account' }).some((h) => h.nodeType === 'actionCalls')).to.equal(true);
    const typeId = searchFieldInFlow(flow, { fieldName: 'RecordTypeId', object: 'Account' });
    expect(typeId.some((h) => h.usage === 'write' && h.detail === 'actionCall.outputParameter')).to.equal(true);
  });

  it('indexes nested screens and lookup components', async () => {
    const flow = parseFlowFile(await loadFixture('screens-object-field.flow-meta.xml'), join(fixtures, 'Screen_Sample.flow-meta.xml'));
    expect(searchFieldInFlow(flow, { fieldName: 'Phone', object: 'Account' }).some((h) => h.detail === 'screen.objectFieldReference')).to
      .equal(true);
    expect(searchFieldInFlow(flow, { fieldName: 'ParentId', object: 'Account' }).some((h) => h.detail === 'screen.component.fieldApiName')).to
      .equal(true);
    expect(searchObjectInFlow(flow, { objectName: 'Account' }).some((h) => h.detail === 'screen.component.objectApiName')).to.equal(true);
  });

  it('indexes subflow input assignments', async () => {
    const flow = parseFlowFile(await loadFixture('subflows.flow-meta.xml'), join(fixtures, 'Subflow_Sample.flow-meta.xml'));
    expect(
      searchFieldInFlow(flow, { fieldName: 'ParentId', object: 'SampleObject__c' }).some((h) => h.detail === 'subflow.inputAssignment'),
    ).to.equal(true);
  });

  it('indexes collection processor conditions', async () => {
    const flow = parseFlowFile(
      await loadFixture('collection-processor.flow-meta.xml'),
      join(fixtures, 'Collection_Processor_Sample.flow-meta.xml'),
    );
    expect(
      searchFieldInFlow(flow, { fieldName: 'Status__c' }).some((h) => h.detail === 'collectionProcessor.condition.leftValueReference'),
    ).to.equal(true);
  });

  it('indexes loop collection references', async () => {
    const flow = parseFlowFile(await loadFixture('loops.flow-meta.xml'), join(fixtures, 'Loop_Sample.flow-meta.xml'));
    expect(searchFieldInFlow(flow, { fieldName: 'Amount__c' }).some((h) => h.detail === 'loop.collectionReference')).to.equal(true);
  });

  it('indexes custom error field selections', async () => {
    const flow = parseFlowFile(await loadFixture('custom-errors.flow-meta.xml'), join(fixtures, 'Custom_Errors_Sample.flow-meta.xml'));
    expect(
      searchFieldInFlow(flow, { fieldName: 'Status__c', object: 'Contact' }).some((h) => h.detail === 'customError.fieldSelection'),
    ).to.equal(true);
  });

  it('indexes relationship path segments', async () => {
    const flow = parseFlowFile(
      await loadFixture('relationship-path.flow-meta.xml'),
      join(fixtures, 'Relationship_Path_Sample.flow-meta.xml'),
    );
    expect(
      searchFieldInFlow(flow, { fieldName: 'Account', object: 'SampleObject__c' }).some((h) => h.nodeType === 'decisions'),
    ).to.equal(true);
    expect(
      searchFieldInFlow(flow, { fieldName: 'BillingState', object: 'Account' }).some((h) => h.nodeType === 'decisions'),
    ).to.equal(true);
    expect(
      searchFieldInFlow(flow, { fieldName: 'RelatedObject__r', object: 'SampleObject__c' }).some((h) => h.nodeType === 'formulas'),
    ).to.equal(true);
    expect(
      searchFieldInFlow(flow, { fieldName: 'Status__c', object: 'RelatedObject__c' }).some((h) => h.nodeType === 'formulas'),
    ).to.equal(true);
  });

  it('indexes lookup output context in decisions and DML', async () => {
    const flow = parseFlowFile(
      await loadFixture('lookup-output-context.flow-meta.xml'),
      join(fixtures, 'Lookup_Output_Sample.flow-meta.xml'),
    );
    expect(
      searchFieldInFlow(flow, { fieldName: 'Custom__c', object: 'ChildObject__c' }).some(
        (h) => h.detail === 'decision.condition.leftValueReference',
      ),
    ).to.equal(true);
    expect(
      searchFieldInFlow(flow, { fieldName: 'Id', object: 'ChildObject__c' }).some(
        (h) => h.detail === 'inputAssignment.value.elementReference',
      ),
    ).to.equal(true);
  });

  it('indexes decision rightValue elementReference', async () => {
    const flow = parseFlowFile(
      await loadFixture('decisions-right-ref.flow-meta.xml'),
      join(fixtures, 'Decision_Right_Ref.flow-meta.xml'),
    );
    const hits = searchFieldInFlow(flow, { fieldName: 'Amount__c', object: 'LineItem__c' });
    expect(hits.some((h) => h.detail === 'decision.condition.leftValueReference')).to.equal(true);
    expect(hits.some((h) => h.detail === 'decision.condition.rightValue.elementReference')).to.equal(true);
  });

  it('indexes start filter formulas', async () => {
    const flow = parseFlowFile(
      await loadFixture('start-filter-formula.flow-meta.xml'),
      join(fixtures, 'Start_Formula_Sample.flow-meta.xml'),
    );
    expect(
      searchFieldInFlow(flow, { fieldName: 'CustomFlag__c', object: 'SampleObject__c' }).some((h) => h.detail === 'start.filterFormula'),
    ).to.equal(true);
    expect(
      searchFieldInFlow(flow, { fieldName: 'OwnerId', object: 'SampleObject__c' }).some((h) => h.detail === 'start.filterFormula'),
    ).to.equal(true);
  });
});