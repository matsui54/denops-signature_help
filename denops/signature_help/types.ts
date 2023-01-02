export type MarkupContent = {
  kind: MarkupKind;
  value: string;
};
export type MarkupKind = "plaintext" | "markdown";

export type PopupPos = {
  height: number;
  width: number;
  row: number;
  col: number;
  size: number;
  scrollbar: boolean;
};

export type Border =
  | "none"
  | "single"
  | "double"
  | "rounded"
  | "solid"
  | "shadow";

export type FloatOption = {
  width?: number;
  height?: number;
  row?: number;
  col?: number;
  border?: boolean;
};

export type ServerCapabilities = {
  signatureHelpProvider?: SignatureHelpOptions;
};

export type SignatureHelpOptions = {
  triggerCharacters?: string[];
  retriggerCharacters?: string[];
};

export type OpenFloatOptions = {
  syntax: string;
  lines: string[];
  floatOpt: FloatOption;
  maxWidth: number;
  maxHeight: number;
  blend?: number;
};
