import { SighelpResponce } from "./event.ts";
import { Denops, fn, op } from "./deps.ts";
import { FloatOption, SignatureHelp } from "./types.ts";
import { Config } from "./config.ts";
import {
  convertSignatureHelpToMarkdownLines,
  getStylizeCommands,
} from "./markdown.ts";

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

export function findLabel(line: string, name: string, trigger: string): number {
  const pairs = {
    "(": ")",
    "<": ">",
    "{": "}",
  };
  if (!(trigger in pairs)) {
    return -1;
  }
  const left = "\\" + trigger;
  const right = "\\" + pairs[trigger as "(" | "<" | "{"];
  const expStr =
    `${name}${left}(([^${left}${right}]*)|(${left}[^${left}${right}]*${right}))*$`;
  const pos = line.search(expStr);
  if (pos != -1) {
    return pos;
  }
  return line.search(name + left);
}

export function getFunctionName(
  triggers: string[],
  label: string,
): [string, string] | null {
  // make regexp from triggerCharacters
  const triggerExp = triggers.map((c) => "\\" + c).join("|");
  const newExp = "^(\\w*)(" + triggerExp + ")";

  const matches = label.match(newExp);
  if (matches && matches.length == 3) {
    return [matches[1], matches[2]];
  } else {
    return null;
  }
}

export class SigHandler {
  private prevItem: SignatureHelp = {} as SignatureHelp;

  onInsertEnter() {
    this.prevItem = {} as SignatureHelp;
  }

  async requestSighelp(denops: Denops, triggers: string[]) {
    await denops.call(
      "luaeval",
      "require('signature_help.nvimlsp').get_signature_help(_A.arg)",
      { arg: { triggers: triggers } },
    );
  }

  async closeWin(denops: Denops) {
    await denops.call(
      "signature_help#doc#close_floating",
      {},
    );
  }

  async changeHighlight(denops: Denops, hl: [number, number]) {
    await denops.call(
      "signature_help#doc#change_highlight",
      { hl: hl },
    );
  }

  private isSameSignature(item: SignatureHelp) {
    if (!this.prevItem || !this.prevItem.signatures) return false;
    return this.prevItem.signatures[0].label == item.signatures[0].label;
  }

  private isSamePosition(item: SignatureHelp) {
    const isSame = item.activeSignature == this.prevItem.activeSignature &&
      item.activeParameter == this.prevItem.activeParameter;
    return isSame;
  }

  // return floating windows column offset from cursor position
  private async calcWinPos(
    denops: Denops,
    info: SighelpResponce,
  ): Promise<number> {
    const label = info.help.signatures[0].label;
    const cursorCol = await fn.col(denops, ".");
    const match = getFunctionName(info.triggers, label);
    if (!match) {
      return 0;
    }
    const [name, trigger] = match;
    const input = (await fn.getline(denops, ".")).slice(0, cursorCol - 1);
    const labelIdx = findLabel(input, name, trigger);
    if (labelIdx == -1) {
      return 0;
    }
    return labelIdx - input.length;
  }

  async showSignatureHelp(
    denops: Denops,
    info: SighelpResponce,
    config: Config,
  ): Promise<void> {
    const maybe = convertSignatureHelpToMarkdownLines(
      info.help,
      await op.filetype.getLocal(denops),
      info.triggers,
      config.style,
    );
    if (!maybe) return;
    const [lines, hl] = maybe;
    const mode = await fn.mode(denops);
    // if allow select mode, vsnip's jump becomes unavailable
    if (!lines?.length || !mode.startsWith("i")) {
      this.closeWin(denops);
      return;
    }

    if (this.isSameSignature(info.help)) {
      if (this.isSamePosition(info.help)) {
        return;
      } else {
        this.changeHighlight(denops, hl);
        this.prevItem = info.help;
        return;
      }
    }
    this.prevItem = info.help;

    const screenrow = await fn.screenrow(denops) as number;
    const maxWidth = Math.min(
      await op.columns.get(denops),
      config.maxWidth,
    );
    const maxHeight = Math.min(screenrow - 1, config.maxHeight);
    const col = await this.calcWinPos(denops, info);

    const hiCtx = await getStylizeCommands(denops, lines, {
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      separator: "",
      syntax: "markdown",
      border: config.border,
    });

    const floatingOpt: FloatOption = {
      row: screenrow - hiCtx.height - (config.border ? 2 : 0),
      col: col + (await fn.screencol(denops) as number),
      border: config.border,
    };

    await denops.call(
      "signature_help#doc#show_floating",
      {
        lines: hiCtx.stripped,
        floatOpt: floatingOpt,
        events: ["InsertLeave", "CursorMoved"],
        width: hiCtx.width,
        height: hiCtx.height,
        syntax: "markdown",
        winblend: config.winblend,
        cmds: hiCtx.commands,
        hl: hl,
      },
    ) as number;
  }
}
