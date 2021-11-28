import { autocmd } from "./deps.ts";

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

export type SignatureHelp = {
  /**
   * One or more signatures. If no signatures are available the signature help
   * request should return `null`.
   */
  signatures: SignatureInformation[];

  /**
   * The active signature. If omitted or the value lies outside the
   * range of `signatures` the value defaults to zero or is ignore if
   * the `SignatureHelp` as no signatures.
   *
   * Whenever possible implementors should make an active decision about
   * the active signature and shouldn't rely on a default value.
   *
   * In future version of the protocol this property might become
   * mandatory to better express this.
   */
  activeSignature?: number;

  /**
   * The active parameter of the active signature. If omitted or the value
   * lies outside the range of `signatures[activeSignature].parameters`
   * defaults to 0 if the active signature has parameters. If
   * the active signature has no parameters it is ignored.
   * In future version of the protocol this property might become
   * mandatory to better express the active parameter if the
   * active signature does have any.
   */
  activeParameter?: number;
};
/**
 * Represents the signature of something callable. A signature
 * can have a label, like a function-name, a doc-comment, and
 * a set of parameters.
 */
export interface SignatureInformation {
  /**
   * The label of this signature. Will be shown in
   * the UI.
   */
  label: string;

  /**
   * The human-readable doc-comment of this signature. Will be shown
   * in the UI but can be omitted.
   */
  documentation?: string | MarkupContent;

  /**
   * The parameters of this signature.
   */
  parameters?: ParameterInformation[];

  /**
   * The index of the active parameter.
   *
   * If provided, this is used in place of `SignatureHelp.activeParameter`.
   *
   * @since 3.16.0
   */
  activeParameter?: number;
}
/**
 * Represents a parameter of a callable-signature. A parameter can
 * have a label and a doc-comment.
 */
export interface ParameterInformation {
  /**
   * The label of this parameter information.
   *
   * Either a string or an inclusive start and exclusive end offsets within
   * its containing signature label. (see SignatureInformation.label). The
   * offsets are based on a UTF-16 string representation as `Position` and
   * `Range` does.
   *
   * *Note*: a label of type string should be a substring of its containing
   * signature label. Its intended use case is to highlight the parameter
   * label part in the `SignatureInformation.label`.
   */
  label: string | [number, number];

  /**
   * The human-readable doc-comment of this parameter. Will be shown
   * in the UI but can be omitted.
   */
  documentation?: string | MarkupContent;
}

export type OpenFloatOptions = {
  syntax: string;
  lines: string[];
  floatOpt: FloatOption;
  events: autocmd.AutocmdEvent[];
  maxWidth: number;
  maxHeight: number;
  blend?: number;
};
