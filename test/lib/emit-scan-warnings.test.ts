import { expect } from 'chai';
import { emitScanWarnings } from '../../src/shared/emit-scan-warnings.js';
import type { FlowScanMeta } from '../../src/shared/discover-flow-scan-meta.js';

describe('emit-scan-warnings', () => {
  it('emits local-only and outside-package warnings for project scans', () => {
    const warned: string[] = [];
    const command = {
      warn: (msg: string) => {
        warned.push(msg);
      },
    };

    const meta: FlowScanMeta = {
      packageRoots: ['/tmp/project/force-app'],
      excludedOutsidePackage: ['/tmp/project/other/B.flow-meta.xml'],
      excludedCount: 1,
      excludedSampleRelativePaths: ['other/B.flow-meta.xml'],
      singleFileScope: false,
    };

    emitScanWarnings(command, meta);
    expect(warned.length).to.equal(2);
    expect(warned[0]).to.include('packageDirectories');
    expect(warned[1]).to.include('outside packageDirectories');
  });

  it('emits no warnings for single-file scope', () => {
    const warned: string[] = [];
    emitScanWarnings(
      { warn: (msg: string) => warned.push(msg) },
      {
        packageRoots: [],
        excludedOutsidePackage: [],
        excludedCount: 5,
        excludedSampleRelativePaths: [],
        singleFileScope: true,
      },
    );
    expect(warned).to.deep.equal([]);
  });
});