import { Denops, fn, op } from "./deps.ts";
import { FloatOption, SignatureHelp } from "./types.ts";
import { Config } from "./config.ts";
import { requestSignatureHelp } from "./integ.ts";
import {
  convertSignatureHelpToMarkdownLines,
  getStylizeCommands,
} from "./markdown.ts";

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
  private triggers: string[] = [];

  onInsertEnter() {
    this.prevItem = {} as SignatureHelp;
  }

  async requestSighelp(denops: Denops, triggers: string[]) {
    this.triggers = triggers;
    await requestSignatureHelp(denops);
  }

  async closeWin(denops: Denops) {
    await denops.call(
      "signature_help#doc#close_floating",
    );
  }

  async changeHighlight(denops: Denops, hl: null | [number, number]) {
    await denops.call(
      "signature_help#doc#change_highlight",
      { hl: hl },
    );
  }

  private isSameSignature(item: SignatureHelp) {
    if (!this.prevItem || !this.prevItem.signatures) return false;

    const activeSignatureOf = (item: SignatureHelp) => {
      const index = item.activeSignature ?? 0;
      return Math.max(0, Math.min(index, item.signatures.length - 1));
    };
    return (
      this.prevItem.signatures[activeSignatureOf(this.prevItem)].label ==
      item.signatures[activeSignatureOf(item)].label
    );
  }

  private isSamePosition(item: SignatureHelp) {
    const isSame = item.activeSignature == this.prevItem.activeSignature &&
      item.activeParameter == this.prevItem.activeParameter;
    return isSame;
  }

  // return floating windows column offset from cursor position
  private async calcWinPos(
    denops: Denops,
    help: SignatureHelp,
  ): Promise<number> {
    const label = help.signatures[0].label;
    const cursorCol = await fn.col(denops, ".");
    const match = getFunctionName(this.triggers, label);
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

  async showVirtualText(
    denops: Denops,
    line: string,
  ): Promise<void> {
    if (await fn.has(denops, "nvim")) {
      await denops.call(
        "signature_help#doc#show_virtual_text",
        { line: line },
      );
    } else {
      await denops.call(
        "signature_help#doc#show_floating",
        {
          lines: [line],
          floatOpt: {
            row: await fn.screenrow(denops) as number,
            col: (await fn.getline(denops, ".") as string).length + 5,
            border: false,
            width: line.length,
            height: 1,
          },
        },
      ) as number;
    }
  }

  async showSignatureHelp(
    denops: Denops,
    help: SignatureHelp,
    config: Config,
  ): Promise<void> {
    const maybe = convertSignatureHelpToMarkdownLines(
      help,
      await op.filetype.getLocal(denops),
      this.triggers,
      config.style,
      config.multiLabel,
    );
    if (!maybe) return;
    const [lines, hl] = maybe;
    const mode = await fn.mode(denops);
    // if allow select mode, vsnip's jump becomes unavailable
    if (!lines?.length || !mode.startsWith("i")) {
      this.closeWin(denops);
      return;
    }

    if (config.style == "virtual") {
      this.showVirtualText(denops, lines[0]);
      return;
    }

    if (this.isSameSignature(help)) {
      if (!config.onTriggerChar) {
        if (this.isSamePosition(help)) {
          return;
        } else if (config.style != "currentLabelOnly") {
          this.changeHighlight(denops, hl);
          this.prevItem = help;
          return;
        }
      }
    }
    this.prevItem = help;

    const screenrow = await fn.screenrow(denops) as number;
    const maxWidth = Math.min(
      await op.columns.get(denops),
      config.maxWidth,
    );
    const maxHeight = Math.min(screenrow - 1, config.maxHeight);
    const col = config.style == "currentLabelOnly"
      ? 0
      : await this.calcWinPos(denops, help);

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
      height: hiCtx.height,
      width: hiCtx.width,
    };

    await denops.call(
      "signature_help#doc#show_floating",
      {
        lines: hiCtx.stripped,
        floatOpt: floatingOpt,
        syntax: "markdown",
        winblend: config.winblend,
        cmds: hiCtx.commands,
        hl: hl,
      },
    ) as number;
  }
}
