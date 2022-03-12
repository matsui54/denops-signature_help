import { Denops } from "./deps.ts";
import { EventHandler } from "./event.ts";
import { SignatureHelp } from "./types.ts";

export function main(denops: Denops) {
  const handler = new EventHandler();

  denops.dispatcher = {
    async onTextChanged(_): Promise<void> {
      await handler.onTextChanged(denops);
    },
    async onInsertEnter(_): Promise<void> {
      await handler.onInsertEnter(denops);
    },

    async respond(arg1: unknown): Promise<void> {
      await handler.onSighelpResponce(denops, arg1 as SignatureHelp);
    },
  };
}
