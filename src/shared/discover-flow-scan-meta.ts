import { readdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { SfProject } from '@salesforce/core';
import type { DiscoverFlowsOptions } from './types.js';

export type FlowScanMeta = {
  packageRoots: string[];
  excludedOutsidePackage: string[];
  excludedCount: number;
  excludedSampleRelativePaths: string[];
  singleFileScope: boolean;
};

const SKIP_DIR_NAMES = new Set([
  '.git',
  '.sf',
  '.sfdx',
  '.yarn',
  'coverage',
  'dist',
  'lib',
  'node_modules',
]);

const EXCLUDED_SAMPLE_LIMIT = 3;

export function isPathUnderRoot(filePath: string, root: string): boolean {
  const file = resolve(filePath);
  const rootResolved = resolve(root);
  return file === rootResolved || file.startsWith(rootResolved + sep);
}

export function isSingleFileFlowScope(flow?: string): boolean {
  return Boolean(
    flow &&
      (flow.endsWith('.flow-meta.xml') ||
        flow.includes('/') ||
        flow.includes('\\') ||
        isAbsolute(flow)),
  );
}

export function resolvePackageRoots(projectPath: string, packageDirPaths: string[]): string[] {
  const base = resolve(projectPath);
  return packageDirPaths.length > 0 ? packageDirPaths.map((p) => resolve(base, p)) : [base];
}

async function walkFlowFilesSkippingDirs(rootDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    await Promise.all(
      entries.map(async (entry) => {
        const full = join(current, entry.name);
        if (entry.isDirectory()) {
          if (SKIP_DIR_NAMES.has(entry.name)) {
            return;
          }
          await walk(full);
        } else if (entry.name.endsWith('.flow-meta.xml')) {
          results.push(full);
        }
      }),
    );
  }

  await walk(resolve(rootDir));
  return results.sort();
}

export async function discoverFlowScanMeta(options: DiscoverFlowsOptions = {}): Promise<FlowScanMeta> {
  const project = await SfProject.resolve(options.projectDir);
  const projectPath = resolve(project.getPath());
  const packageDirPaths = project.getUniquePackageDirectories().map((p) => p.path);
  const packageRoots = resolvePackageRoots(projectPath, packageDirPaths);
  const singleFileScope = isSingleFileFlowScope(options.flow);

  if (singleFileScope) {
    return {
      packageRoots,
      excludedOutsidePackage: [],
      excludedCount: 0,
      excludedSampleRelativePaths: [],
      singleFileScope: true,
    };
  }

  const allInProject = await walkFlowFilesSkippingDirs(projectPath);
  const excluded = allInProject.filter((file) => !packageRoots.some((root) => isPathUnderRoot(file, root)));

  return {
    packageRoots,
    excludedOutsidePackage: excluded,
    excludedCount: excluded.length,
    excludedSampleRelativePaths: excluded.slice(0, EXCLUDED_SAMPLE_LIMIT).map((p) => relative(projectPath, p)),
    singleFileScope: false,
  };
}