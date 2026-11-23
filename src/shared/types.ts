export type UsageKind = 'read' | 'write';

export type FieldReference = {
  field: string;
  object?: string;
  usage: UsageKind;
  detail: string;
  nodeName: string;
  nodeType: string;
  nodeLabel?: string;
};

export type ObjectReference = {
  object: string;
  detail: string;
  nodeName: string;
  nodeType: string;
  nodeLabel?: string;
};

export type ParsedFlow = {
  apiName: string;
  label?: string;
  filePath: string;
  recordObject?: string;
  fieldRefs: FieldReference[];
  objectRefs: ObjectReference[];
};

export type FlowHit = {
  flow: string;
  flowLabel?: string;
  filePath: string;
  node: string;
  nodeType: string;
  nodeLabel?: string;
  usage: UsageKind | 'reference';
  detail: string;
  field?: string;
  object?: string;
};

export type DiscoverFlowsOptions = {
  projectDir?: string;
  flow?: string;
  flowRegexp?: string;
};

export type FieldSearchOptions = {
  fieldName: string;
  object?: string;
};

export type ObjectSearchOptions = {
  objectName: string;
};