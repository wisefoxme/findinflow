/** Split a flow element reference such as `Get_Account.Name` or `$Record.DOB__c`. */
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
    const rest = trimmed.slice('$Record.'.length);
    const parts = rest.split('.');
    const field = parts.at(-1);
    if (parts.length === 1 && field) {
      return { object: recordObject, field };
    }
    // Nested relationship path: use record object when the path is shallow.
    return { object: recordObject, field };
  }

  const dot = trimmed.lastIndexOf('.');
  if (dot === -1) {
    return { field: trimmed };
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