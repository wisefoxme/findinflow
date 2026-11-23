import { expect } from 'chai';
import { formulaReferences, parseElementReference } from '../../src/shared/ref-parse.js';

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
});