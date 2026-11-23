export type PathFieldRef = { field: string; object?: string };

/** Guess related object after a relationship field segment (no org describe). */
export function inferObjectFromRelationshipField(
  segment: string,
  currentObject: string | undefined,
): string | undefined {
  if (segment.endsWith('__r')) {
    return `${segment.slice(0, -3)}__c`;
  }
  if (segment.endsWith('__c')) {
    return currentObject;
  }
  if (!segment.includes('__')) {
    return segment;
  }
  return currentObject;
}

function walkPathSegments(parts: string[], initialObject: string | undefined): PathFieldRef[] {
  const results: PathFieldRef[] = [];
  let currentObject = initialObject;
  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];
    results.push({ field: segment, object: currentObject });
    if (i < parts.length - 1) {
      currentObject = inferObjectFromRelationshipField(segment, currentObject);
    }
  }
  return results;
}

/** Expand a reference into one field index entry per path segment (read usage). */
export function expandReadPath(
  ref: string,
  recordObject?: string,
  variableObjects: ReadonlyMap<string, string> = new Map(),
): PathFieldRef[] {
  const trimmed = ref.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('$Record.')) {
    const parts = trimmed.slice('$Record.'.length).split('.').filter(Boolean);
    if (parts.length === 0) {
      return [];
    }
    return walkPathSegments(parts, recordObject);
  }

  const dot = trimmed.indexOf('.');
  if (dot === -1) {
    const object = variableObjects.get(trimmed);
    if (object) {
      return [{ field: 'Id', object }];
    }
    return [{ field: trimmed, object: undefined }];
  }

  const varName = trimmed.slice(0, dot);
  const parts = trimmed.slice(dot + 1).split('.').filter(Boolean);
  if (parts.length === 0) {
    return [];
  }
  return walkPathSegments(parts, variableObjects.get(varName));
}

/** Split a flow element reference for write targets (last segment, object from path inference). */
export function parseElementReference(
  ref: string,
  recordObject?: string,
  variableObjects: ReadonlyMap<string, string> = new Map(),
): { object?: string; field?: string } {
  const trimmed = ref.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('$Record.')) {
    const expanded = expandReadPath(trimmed, recordObject, variableObjects);
    const last = expanded.at(-1);
    if (last) {
      return { object: last.object, field: last.field };
    }
    return {};
  }

  const dot = trimmed.lastIndexOf('.');
  if (dot === -1) {
    return { field: trimmed };
  }

  const expanded = expandReadPath(trimmed, recordObject, variableObjects);
  const last = expanded.at(-1);
  if (last) {
    return { object: last.object, field: last.field };
  }

  const varName = trimmed.slice(0, dot);
  const field = trimmed.slice(dot + 1);
  const object = variableObjects.get(varName);
  return { object, field };
}

/** Pull `{!ref}` tokens from a formula or expression string. */
export function formulaReferences(expression: string): string[] {
  const refs: string[] = [];
  const re = /\{!([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(expression)) !== null) {
    refs.push(match[1].trim());
  }
  return refs;
}