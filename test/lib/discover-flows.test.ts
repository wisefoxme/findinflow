import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect } from 'chai';
import { discoverFlowFiles, flowBaseName } from '../../src/shared/discover-flows.js';

describe('discover-flows', () => {
  it('discovers all flows in package directory', async () => {
    const root = join(tmpdir(), `findinflow-${Date.now()}`);
    const pkg = join(root, 'force-app');
    const flowsDir = join(pkg, 'main/default/flows');
    await mkdir(flowsDir, { recursive: true });
    await writeFile(
      join(root, 'sfdx-project.json'),
      JSON.stringify({ packageDirectories: [{ path: 'force-app' }] }),
      'utf8',
    );
    await writeFile(join(flowsDir, 'Alpha.flow-meta.xml'), '<Flow></Flow>', 'utf8');
    await writeFile(join(flowsDir, 'Beta.flow-meta.xml'), '<Flow></Flow>', 'utf8');

    const all = await discoverFlowFiles({ projectDir: root });
    expect(all.length).to.equal(2);

    const one = await discoverFlowFiles({ projectDir: root, flow: 'Alpha' });
    expect(one.length).to.equal(1);
    expect(flowBaseName(one[0])).to.equal('Alpha');

    const filtered = await discoverFlowFiles({ projectDir: root, flowRegexp: '^A' });
    expect(filtered.length).to.equal(1);
    expect(flowBaseName(filtered[0])).to.equal('Alpha');

    const byPath = await discoverFlowFiles({
      projectDir: root,
      flow: join(flowsDir, 'Beta.flow-meta.xml'),
    });
    expect(byPath).to.have.length(1);
    expect(flowBaseName(byPath[0])).to.equal('Beta');
  });
});