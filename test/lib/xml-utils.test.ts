import { expect } from 'chai';
import { asArray, textOf } from '../../src/shared/xml-utils.js';

describe('xml-utils', () => {
  it('coerces values to arrays', () => {
    expect(asArray('x')).to.deep.equal(['x']);
    expect(asArray(['x'])).to.deep.equal(['x']);
    expect(asArray(undefined)).to.deep.equal([]);
  });

  it('reads text leaves', () => {
    expect(textOf('hello')).to.equal('hello');
    expect(textOf({ '#text': 'nested' })).to.equal('nested');
  });
});