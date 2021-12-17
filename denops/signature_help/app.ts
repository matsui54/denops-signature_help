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

  await handler.getConfig(denops);
  registerAutocmd(denops);

  const [hldoc, hlborder] = await gather(denops, async (denops) => {
    await fn.hlexists(denops, "PopupPreviewDocument");
    await fn.hlexists(denops, "PopupPreviewBorder");
  }) as [boolean, boolean];
  await batch(denops, async (denops) => {
    await vars.g.set(denops, "signature_help#_initialized", 1);
    if (!hldoc) {
      await denops.cmd("highlight link PopupPreviewDocument NormalFloat");
    }
    if (!hlborder) {
      await denops.cmd("highlight link PopupPreviewBorder NormalFloat");
    }
  });
}
