import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect } from 'chai';
import { loadParsedFlows } from '../../src/shared/run-scan.js';

describe('run-scan', () => {
  it('loads and parses flows from a DX project', async () => {
    const root = join(tmpdir(), `findinflow-scan-${Date.now()}`);
    const flowsDir = join(root, 'force-app/main/default/flows');
    await mkdir(flowsDir, { recursive: true });
    await writeFile(
      join(root, 'sfdx-project.json'),
      JSON.stringify({ packageDirectories: [{ path: 'force-app' }] }),
      'utf8',
    );
    const content = await readFile(join(process.cwd(), 'test/fixtures/dob-assignment.flow-meta.xml'), 'utf8');
    await writeFile(join(flowsDir, 'Mini.flow-meta.xml'), content, 'utf8');

    const flows = await loadParsedFlows({ projectDir: root });
    expect(flows).to.have.length(1);
    expect(flows[0].apiName).to.equal('Mini');
    expect(flows[0].fieldRefs.length).to.be.greaterThan(0);
  });
});