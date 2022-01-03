import { autocmd, batch, Denops, fn, gather, vars } from "./deps.ts";
import { EventHandler } from "./event.ts";
import { SignatureHelp } from "./types.ts";

export async function main(denops: Denops) {
  const handler = new EventHandler();

  denops.dispatcher = {
    async enable(_): Promise<void> {
      await registerAutocmd(denops);
    },

    async onEvent(arg1: unknown): Promise<void> {
      const event = arg1 as autocmd.AutocmdEvent;
      if (event == "ColorScheme") {
        await initializeHighlight(denops);
        return;
      }
      await handler.onEvent(denops, event);
    },

    async respond(arg1: unknown): Promise<void> {
      await handler.onSighelpResponce(denops, arg1 as SignatureHelp);
    },
  };

  async function registerAutocmd(denops: Denops): Promise<void> {
    await autocmd.group(
      denops,
      "DpsSignatureHelp",
      (helper: autocmd.GroupHelper) => {
        helper.remove("*");
        for (
          const event of [
            "InsertEnter",
            "TextChangedI",
            "TextChangedP",
          ] as autocmd.AutocmdEvent[]
        ) {
          helper.define(
            event,
            "*",
            `call signature_help#notify('onEvent', ["${event}"])`,
          );
        }
      },
    );
  }

  async function initializeHighlight(denops: Denops): Promise<void> {
    await batch(denops, async (denops) => {
      await denops.cmd(
        "highlight default link SignatureHelpDocument NormalFloat",
      );
      await denops.cmd("highlight default link SignatureHelpBorder NormalFloat");
      await denops.cmd("highlight default link SignatureHelpVirtual Error");
    });
  }

  await handler.getConfig(denops);
  await registerAutocmd(denops);
  await initializeHighlight(denops);

  await autocmd.group(
    denops,
    "SignatureHelp-hl",
    (helper: autocmd.GroupHelper) => {
      helper.remove("*");
      helper.define(
        "ColorScheme",
        "*",
        `call signature_help#notify('onEvent', ["ColorScheme"])`,
      );
    },
  );
}
