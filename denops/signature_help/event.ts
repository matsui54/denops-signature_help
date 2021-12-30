import { autocmd, Denops, fn, vars } from "./deps.ts";
import { ServerCapabilities, SignatureHelp } from "./types.ts";
import { Config, makeConfig } from "./config.ts";
import { SigHandler } from "./signature.ts";
import { getServerCapabilities } from "./integ.ts";

const defaultTriggerCharacters = [",", "(", "<", "["];
const triggerCloseCharacters = [")", ">", "]"];

export class EventHandler {
  private config: Config = {} as Config;
  private sigHandler = new SigHandler();
  private capabilities: ServerCapabilities | null = null;

  private async onInsertEnter(denops: Denops): Promise<void> {
    await this.getConfig(denops);
    this.sigHandler.onInsertEnter();
    this.capabilities = await getServerCapabilities(denops);
    if (this.capabilities && this.capabilities.signatureHelpProvider) {
      this.sigHandler.requestSighelp(denops, defaultTriggerCharacters);
    }
  }

  private async onTextChanged(denops: Denops): Promise<void> {
    if (
      !this.capabilities || !this.capabilities.signatureHelpProvider
    ) {
      return;
    }
    let triggerCharacters = defaultTriggerCharacters;
    if (this.capabilities.signatureHelpProvider?.triggerCharacters) {
      triggerCharacters =
        this.capabilities.signatureHelpProvider.triggerCharacters;
    }
    const allTriggerChars = triggerCharacters.concat(triggerCloseCharacters);

    const cursorCol = await fn.col(denops, ".");
    const line = await fn.getline(denops, ".");
    if (
      allTriggerChars.includes(line[cursorCol - 2])
    ) {
      this.sigHandler.requestSighelp(denops, triggerCharacters);
    } else if (this.config.style == "virtual") {
      if (!(await fn.has(denops, "nvim"))) {
        await denops.call("signature_help#doc#update_virtual_text");
      }
    }
  }

  async getConfig(denops: Denops): Promise<void> {
    const users = await vars.g.get(
      denops,
      "signature_help_config",
      {},
    ) as Config;
    this.config = makeConfig(users);
  }

  async onEvent(denops: Denops, event: autocmd.AutocmdEvent): Promise<void> {
    if (event == "InsertEnter") {
      this.onInsertEnter(denops);
    } else {
      if (!this.capabilities) {
        this.capabilities = await getServerCapabilities(denops);
      }
      if (event == "TextChangedI" || event == "TextChangedP") {
        this.onTextChanged(denops);
      }
    }
  }

  async onSighelpResponce(denops: Denops, arg: SignatureHelp) {
    await this.sigHandler.showSignatureHelp(
      denops,
      arg,
      this.config,
    );
  }
}
