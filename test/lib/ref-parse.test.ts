import { expect } from 'chai';
import {
  expandReadPath,
  formulaReferences,
  inferObjectFromRelationshipField,
  parseElementReference,
} from '../../src/shared/ref-parse.js';

describe('ref-parse', () => {
  it('parses $Record field with record object', () => {
    const parsed = parseElementReference('$Record.DOB__c', 'Account');
    expect(parsed).to.deep.equal({ object: 'Account', field: 'DOB__c' });
  });

  it('parses variable field with SObject type map', () => {
    const vars = new Map([['PatientAccount', 'Account']]);
    const parsed = parseElementReference('PatientAccount.FirstName', undefined, vars);
    expect(parsed).to.deep.equal({ object: 'Account', field: 'FirstName' });
  });

  it('extracts formula references', () => {
    expect(formulaReferences('TEXT({!$Record.PersonBirthdate})')).to.deep.equal(['$Record.PersonBirthdate']);
  });

  it('expands $Record relationship path reads', () => {
    const path = expandReadPath('$Record.Account.BillingState', 'Opportunity');
    expect(path).to.deep.equal([
      { field: 'Account', object: 'Opportunity' },
      { field: 'BillingState', object: 'Account' },
    ]);
  });

  it('maps custom __r to related __c object', () => {
    expect(inferObjectFromRelationshipField('Related__r', 'SampleObject__c')).to.equal('Related__c');
    const path = expandReadPath('$Record.RelatedObject__r.Status__c', 'SampleObject__c');
    expect(path.at(-1)).to.deep.equal({ field: 'Status__c', object: 'RelatedObject__c' });
  });

  it('maps standard object relationship suffixes without adding __c', () => {
    expect(inferObjectFromRelationshipField('Opportunity__r', 'LoanEvent__c')).to.equal('Opportunity');
    expect(inferObjectFromRelationshipField('RelatedOpportunity__r', 'LoanEvent__c')).to.equal('Opportunity');
    expect(inferObjectFromRelationshipField('RelatedOpp__r', 'LoanEvent__c')).to.equal('Opportunity');
    expect(expandReadPath('$Record.RelatedOpp__r.OwnerId', 'LoanEvent__c').at(-1)).to.deep.equal({
      field: 'OwnerId',
      object: 'Opportunity',
    });
  });

  it('resolves lookup variable object for field reads', () => {
    const vars = new Map([['Get_Row', 'ChildObject__c']]);
    expect(expandReadPath('Get_Row.Custom__c', undefined, vars)).to.deep.equal([
      { field: 'Custom__c', object: 'ChildObject__c' },
    ]);
    expect(expandReadPath('Get_Row', undefined, vars)).to.deep.equal([{ field: 'Id', object: 'ChildObject__c' }]);
  });
});