import { readdir } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { SfProject } from '@salesforce/core';
import type { DiscoverFlowsOptions } from './types.js';

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkFlowFiles(rootDir: string): Promise<string[]> {
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
          await walk(full);
        } else if (entry.name.endsWith('.flow-meta.xml')) {
          results.push(full);
        }
      }),
    );
  }

  await walk(rootDir);
  return results.sort();
}

function flowBaseName(filePath: string): string {
  const name = filePath.split(/[/\\]/).pop() ?? filePath;
  return name.endsWith('.flow-meta.xml') ? name.slice(0, -'.flow-meta.xml'.length) : name;
}

function matchesFlowFilter(
  filePath: string,
  flow?: string,
  flowRegexp?: RegExp,
): boolean {
  if (flow) {
    if (flow.endsWith('.flow-meta.xml') || flow.includes('/') || flow.includes('\\')) {
      const resolved = resolve(flow);
      return resolve(filePath) === resolved || filePath.endsWith(flow);
    }
    return flowBaseName(filePath) === flow;
  }
  if (flowRegexp) {
    return flowRegexp.test(flowBaseName(filePath));
  }
  return true;
}

export async function discoverFlowFiles(options: DiscoverFlowsOptions = {}): Promise<string[]> {
  const project = await SfProject.resolve(options.projectDir);
  const projectPath = project.getPath();
  const packageDirs = project.getUniquePackageDirectories();
  const searchRoots =
    packageDirs.length > 0
      ? packageDirs.map((p) => join(projectPath, p.path))
      : [projectPath];

  const regexp = options.flowRegexp ? new RegExp(options.flowRegexp) : undefined;
  const collected: string[] = [];

  if (options.flow && (options.flow.endsWith('.flow-meta.xml') || options.flow.includes('/') || isAbsolute(options.flow))) {
    const candidate = isAbsolute(options.flow) ? options.flow : resolve(process.cwd(), options.flow);
    if (await pathExists(candidate)) {
      return [candidate];
    }
    throw new Error(`Flow file not found: ${options.flow}`);
  }

  const perRoot = await Promise.all(searchRoots.map((root) => walkFlowFiles(root)));
  for (const files of perRoot) {
    collected.push(...files);
  }

  const unique = [...new Set(collected)];
  return unique.filter((file) => matchesFlowFilter(file, options.flow, regexp));
}

export { flowBaseName };