/** Coerce parsed XML children into a stable array. */
export function asArray<T>(value: unknown): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return (Array.isArray(value) ? value : [value]) as T[];
}

/** Read plain text from a parsed XML leaf (string or nested value with #text). */
export function textOf(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object' && value !== null && '#text' in value) {
    const inner = (value as { '#text': unknown })['#text'];
    return inner === undefined ? undefined : String(inner);
  }
  return undefined;
}

const FLOW_REPEATABLE_TAGS = new Set([
  'assignments',
  'assignmentItems',
  'recordCreates',
  'recordUpdates',
  'recordLookups',
  'recordDeletes',
  'variables',
  'formulas',
  'decisions',
  'rules',
  'conditions',
  'filters',
  'inputAssignments',
  'queriedFields',
  'processMetadataValues',
  'start',
]);

export const flowXmlArrayTags = FLOW_REPEATABLE_TAGS;