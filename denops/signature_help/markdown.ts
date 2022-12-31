import { Denops, fn, gather, vars } from "./deps.ts";
import { SignatureHelp } from "./types.ts";
import { contentsStyle } from "./config.ts";

type MarkedString = string | { language: string; value: string };
export type MarkupKind = "plaintext" | "markdown";
export type MarkupContent = {
  kind: MarkupKind;
  value: string;
};

export function trimLines(lines: string[] | undefined): string[] {
  if (!lines) return [];
  let start = 0;
  let end = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length) {
      start = i;
      break;
    }
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().length) {
      end = i + 1;
      break;
    }
  }
  return lines.slice(start, end);
}

// --- Converts any of `MarkedString` | `MarkedString[]` | `MarkupContent` into
// --- a list of lines containing valid markdown. Useful to populate the hover
// --- window for `textDocument/hover`, for parsing the result of
// --- `textDocument/signatureHelp`, and potentially others.
// ---
// --@param input (`MarkedString` | `MarkedString[]` | `MarkupContent`)
// --@param contents (table, optional, default `{}`) List of strings to extend with converted lines
// --@returns {contents}, extended with lines of converted markdown.
// --@see https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_hover
export function convertInputToMarkdownLines(
  input: MarkedString | MarkedString[] | MarkupContent,
  contents: string[],
): string[] {
  if (typeof input == "string") {
    contents = contents.concat(input.split("\n"));
  } else {
    if ("kind" in input) {
      let value = input.value;
      if (input.kind == "plaintext") {
        value = "<text>\n" + input.value + "\n</text>";
      }
      contents = contents.concat(value.split("\n"));
    } else if ("language" in input) {
      // MarkedString
      contents.push("```" + input.language);
      contents = contents.concat(input.value.split("\n"));
      contents.push("```");
    } else {
      contents = input.flatMap((mstr) =>
        convertInputToMarkdownLines(mstr, contents)
      );
    }
  }
  if (contents.length == 1 && contents[0] == "") {
    return [];
  }

  return contents;
}

export function convertSignatureHelpToMarkdownLines(
  signatureHelp: SignatureHelp,
  ft: string,
  triggers: string[],
  style: contentsStyle,
  multiLabel = false,
): [string[], [number, number] | null] | null {
  if (!signatureHelp?.signatures) return null;
  let activeHl: [number, number] = [0, 0];
  let activeSignature = (signatureHelp.activeSignature || 0);
  if (
    activeSignature < 0 || activeSignature >= signatureHelp.signatures.length
  ) {
    activeSignature = 0;
  }
  const signature = signatureHelp.signatures[activeSignature];
  if (!signature) return null;

  let labels = [signature.label];
  if (multiLabel) {
    for (let i = 0; i < signatureHelp.signatures.length; i++) {
      if (i == activeSignature) continue;
      const sig = signatureHelp.signatures[i];
      labels.push(sig.label);
    }
  }

  if (ft) {
    labels = ["```" + ft, ...labels, "```"];
  }
  let contents = labels;
  if (signature.documentation) {
    contents = convertInputToMarkdownLines(signature.documentation, contents);
  }
  if (signature.parameters?.length) {
    let activeParameter = signature.activeParameter ||
      signatureHelp.activeParameter || 0;
    if (activeParameter < 0 || activeParameter >= signature.parameters.length) {
      activeParameter = 0;
    }
    if (style == "remainingLabels") {
      let params: string[] = [];
      for (let i = activeParameter; i < signature.parameters.length; i++) {
        const label = signature.parameters[i];
        if (typeof label.label == "string") {
          params = params.concat(label.label);
        } else {
          params = params.concat(
            signature.label.slice(...label.label).split("\n"),
          );
        }
      }
      return [[params.join(", ")], null];
    }

    const parameter = signature.parameters[activeParameter];
    if (parameter) {
      if (parameter.label) {
        if (style == "currentLabel") {
          if (typeof (parameter.label) == "object") {
            return [
              signature.label.slice(...parameter.label).split("\n"),
              null,
            ];
          } else {
            return [parameter.label.split("\n"), null];
          }
        }
        if (typeof (parameter.label) == "object") {
          activeHl = parameter.label;
        } else {
          let offset = 0;
          for (const t of triggers) {
            const triggerOffset = signature.label.indexOf(t);
            if (
              triggerOffset != -1 && (!offset || triggerOffset < offset)
            ) {
              offset = triggerOffset;
            }
          }
          for (let i = 0; i < signature.parameters.length; i++) {
            const param = signature.parameters[i];
            const labelOffset = signature.label.indexOf(
              param.label as string,
              offset,
            );
            if (labelOffset == -1) break;
            if (i == activeParameter) {
              activeHl = [
                labelOffset,
                labelOffset + parameter.label.length,
              ];
              break;
            }
            offset = labelOffset + param.label.length;
          }
        }
      }
      if (parameter.documentation) {
        contents = convertInputToMarkdownLines(
          parameter.documentation,
          contents,
        );
      }
    }
  } else if (style == "remainingLabels") {
    return null;
  }
  if (style == "labels") {
    return [labels, activeHl];
  }
  contents = trimLines(contents);
  return [contents, activeHl];
}

export async function makeFloatingwinSize(
  denops: Denops,
  lines: string[],
  maxWidth: number,
  maxHeight: number,
  border: boolean,
): Promise<[number, number]> {
  if (border) {
    maxWidth -= 2;
    maxHeight -= 2;
  }
  const widths = await gather(denops, async (denops) => {
    for (const line of lines) {
      await fn.strdisplaywidth(denops, line);
    }
  }) as number[];
  const width = Math.min(Math.max(...widths), maxWidth);

  let height = 0;
  for (const w of widths) {
    height += Math.floor((w ? w - 1 : 0) / width) + 1;
  }
  height = Math.min(maxHeight, height);
  return [width, height];
}

export function getMarkdownFences(items: string[]) {
  const fences: Record<string, string> = {};
  for (const item of items) {
    const maybe = item.split("=");
    if (maybe.length == 2) {
      fences[maybe[0]] = maybe[1];
    }
  }
  return fences;
}

type Matcher = {
  ft: string;
  begin: string;
  end: string;
};

type Match = {
  ft: string | null;
  type: string;
};

type Highlight = {
  ft: string | null;
  start: number;
  finish: number;
};

type HighlightContent = {
  stripped: string[];
  highlights: Highlight[];
  width: number;
  height: number;
};

type FloatOption = {
  maxWidth: number;
  maxHeight: number;
  separator?: string;
  syntax: string;
  border: boolean;
};

export async function getHighlights(
  denops: Denops,
  contents: string[],
  opts: FloatOption,
): Promise<HighlightContent> {
  if (opts.syntax != "markdown") {
    const [width, height] = await makeFloatingwinSize(
      denops,
      contents,
      opts.maxWidth,
      opts.maxHeight,
      opts.border,
    );
    return {
      stripped: contents,
      width: width,
      height: height,
      highlights: [],
    };
  }
  const matchers: Record<string, Matcher> = {
    block: { ft: "", begin: "```+([a-zA-Z0-9_]*)", end: "```+" }, // block
    pre: { ft: "", begin: "<pre>", end: "<\/pre>" }, // pre
    code: { ft: "", begin: "<code>", end: "<\/code>" }, // code
    text: { ft: "plaintex", begin: "<text>", end: "<\/text>" }, // text
  };
  const fences = getMarkdownFences(
    await vars.g.get(
      denops,
      "markdown_fenced_languages",
      [],
    ) as string[],
  );

  function matchBegin(line: string): Match | null {
    for (const type of Object.keys(matchers)) {
      const matcher = matchers[type];
      const match = line.match(matcher.begin);
      if (match) {
        return {
          type: type,
          ft: matcher.ft || match[1] || null,
        };
      }
    }
    return null;
  }

  function matchEnd(line: string, match: Match): boolean {
    return line.search(matchers[match.type].end) != -1;
  }

  const stripped: string[] = [];
  const highlights: Highlight[] = [];
  const markdownLines: boolean[] = [];
  for (let i = 0; i < contents.length;) {
    const line = contents[i];
    const match = matchBegin(line);
    if (match) {
      const start = stripped.length;
      if (match.ft) {
        match.ft = fences[match.ft] || match.ft;
      }
      i++;
      // if (contents[i] && !matchEnd(contents[i], match)) {
      //   // stripped.push("---");
      //   // markdownLines[stripped.length - 1] = true;
      //   stripped.push("```" + match.ft + " " + contents[i]);
      //   i++;
      // }
      while (i < contents.length) {
        const fencedLine = contents[i];
        if (matchEnd(fencedLine, match)) {
          // stripped[stripped.length - 1] = stripped[stripped.length - 1] +
          //   " ```";
          i++;
          break;
        }
        stripped.push(fencedLine);
        i++;
      }
      highlights.push({
        ft: match.ft,
        start: start + 1,
        finish: stripped.length,
      });
      // add separator
      if (i < contents.length) {
        stripped.push("---");
        markdownLines[stripped.length - 1] = true;
      }
    } else {
      // strip any emty lines or separators prior to this separator in actual markdown
      if (/^---+$/.test(line)) {
        while (
          markdownLines[stripped.length - 1] &&
          (/^\s*$/.test(stripped[stripped.length - 1]) ||
            (/^---+$/.test(stripped[stripped.length - 1])))
        ) {
          markdownLines[stripped.length - 1] = false;
          stripped.pop();
        }
      }
      // add the line if its not an empty line following a separator
      if (
        !(/^\s*$/.test(line) && markdownLines[stripped.length - 1] &&
          /^---+$/.test(stripped[stripped.length - 1]))
      ) {
        stripped.push(line);
        markdownLines[stripped.length - 1] = true;
      }
      i++;
    }
  }

  const [width, height] = await makeFloatingwinSize(
    denops,
    stripped,
    opts.maxWidth,
    opts.maxHeight,
    opts.border,
  );
  const sepLine = "─".repeat(width);
  // replace --- with line separator
  for (let i = 0; i < stripped.length; i++) {
    if (/^---+$/.test(stripped[i]) && markdownLines[i]) {
      stripped[i] = sepLine;
    }
  }
  return {
    stripped: stripped,
    highlights: highlights,
    width: width,
    height: height,
  };
}

type HighlightContext = {
  stripped: string[];
  commands: string[];
  width: number;
  height: number;
};

export async function getStylizeCommands(
  denops: Denops,
  lines: string[],
  opts: FloatOption,
): Promise<HighlightContext> {
  const hiContents = await getHighlights(denops, lines, opts);
  const fences = getMarkdownFences(
    await vars.g.get(
      denops,
      "markdown_fenced_languages",
      [],
    ) as string[],
  );
  const cmds: string[] = [];
  let index = 0;
  const langs: Record<string, boolean> = {};
  function applySyntax(
    ft: string | null,
    start: number,
    finish: number,
  ) {
    if (!ft) {
      cmds.push(
        `syntax region markdownCode start=/\\%${start}l/ end=/\\%${
          finish +
          1
        }l/ keepend extend`,
      );
      return;
    }
    ft = fences[ft] || ft;
    const name = ft + index;
    index++;
    const lang = "@" + ft.toUpperCase();
    if (!langs[lang]) {
      cmds.push("unlet! b:current_syntax");
      cmds.push(`silent! syntax include ${lang} syntax/${ft}.vim`);
      langs[lang] = true;
    }
    cmds.push(
      `syntax region ${name} start=/\\%${start}l/ end=/\\%${
        finish +
        1
      }l/ contains=${lang} keepend`,
    );
  }

  cmds.push("syntax clear");

  let last = 1;
  for (const hi of hiContents.highlights) {
    if (last < hi.start) {
      applySyntax("signaturehelp_markdown", last, hi.start - 1);
    }
    applySyntax(hi.ft, hi.start, hi.finish);
    last = hi.finish + 1;
  }
  if (last < hiContents.stripped.length) {
    applySyntax("signaturehelp_markdown", last, hiContents.stripped.length);
  }
  return {
    stripped: hiContents.stripped,
    commands: cmds,
    width: hiContents.width,
    height: hiContents.height,
  };
}
