import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect } from 'chai';
import {
  discoverFlowScanMeta,
  isPathUnderRoot,
  isSingleFileFlowScope,
} from '../../src/shared/discover-flow-scan-meta.js';
import { discoverFlowFiles } from '../../src/shared/discover-flows.js';

describe('discover-flow-scan-meta', () => {
  it('isPathUnderRoot accepts files under a package root', () => {
    const root = '/project/force-app';
    expect(isPathUnderRoot('/project/force-app/main/default/flows/A.flow-meta.xml', root)).to.equal(true);
    expect(isPathUnderRoot('/project/other/flows/A.flow-meta.xml', root)).to.equal(false);
  });

  it('isSingleFileFlowScope detects direct file paths', () => {
    expect(isSingleFileFlowScope('force-app/main/default/flows/A.flow-meta.xml')).to.equal(true);
    expect(isSingleFileFlowScope('Alpha')).to.equal(false);
  });

  it('lists flows outside packageDirectories while discovery stays in-package', async () => {
    const root = join(tmpdir(), `findinflow-meta-${Date.now()}`);
    const inPkg = join(root, 'force-app/main/default/flows');
    const outside = join(root, 'unpackaged/flows');
    await mkdir(inPkg, { recursive: true });
    await mkdir(outside, { recursive: true });
    await writeFile(
      join(root, 'sfdx-project.json'),
      JSON.stringify({ packageDirectories: [{ path: 'force-app' }] }),
      'utf8',
    );
    await writeFile(join(inPkg, 'InPackage.flow-meta.xml'), '<Flow></Flow>', 'utf8');
    await writeFile(join(outside, 'Outside.flow-meta.xml'), '<Flow></Flow>', 'utf8');

    const discovered = await discoverFlowFiles({ projectDir: root });
    expect(discovered).to.have.length(1);
    expect(discovered[0]).to.include('InPackage.flow-meta.xml');

    const meta = await discoverFlowScanMeta({ projectDir: root });
    expect(meta.singleFileScope).to.equal(false);
    expect(meta.excludedCount).to.equal(1);
    expect(meta.excludedSampleRelativePaths.some((p) => p.includes('Outside.flow-meta.xml'))).to.equal(true);
  });

  it('skips excluded scan for single-file scope', async () => {
    const root = join(tmpdir(), `findinflow-meta-single-${Date.now()}`);
    const flowsDir = join(root, 'force-app/main/default/flows');
    await mkdir(flowsDir, { recursive: true });
    await writeFile(
      join(root, 'sfdx-project.json'),
      JSON.stringify({ packageDirectories: [{ path: 'force-app' }] }),
      'utf8',
    );
    const flowPath = join(flowsDir, 'Only.flow-meta.xml');
    await writeFile(flowPath, '<Flow></Flow>', 'utf8');

    const meta = await discoverFlowScanMeta({ projectDir: root, flow: flowPath });
    expect(meta.singleFileScope).to.equal(true);
    expect(meta.excludedCount).to.equal(0);
  });
});