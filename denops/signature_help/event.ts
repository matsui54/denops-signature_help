import { autocmd, Denops, fn, vars } from "./deps.ts";
import { SignatureHelp } from "./types.ts";
import { Config, makeConfig } from "./config.ts";
import { SigHandler } from "./signature.ts";

interface ServerCapabilities {
  signatureHelpProvider?: SignatureHelpOptions;
}

export type SignatureHelpOptions = {
  triggerCharacters?: string[];
  retriggerCharacters?: string[];
};

export type SighelpResponce = {
  help: SignatureHelp;
  triggers: string[];
};

const defaultTriggerCharacters = [",", "(", "<", "["];
const triggerCloseCharacters = [")", ">", "]"];

export class EventHandler {
  private config: Config = {} as Config;
  private sigHandler = new SigHandler();
  private capabilities = {} as ServerCapabilities;

  private async getCapabilities(denops: Denops) {
    this.capabilities = await denops.call(
      "luaeval",
      "require('signature_help.nvimlsp').get_capabilities()",
    ) as ServerCapabilities;
  }

  private async onInsertEnter(denops: Denops): Promise<void> {
    await this.getConfig(denops);
    this.sigHandler.onInsertEnter();
    await this.getCapabilities(denops);
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
    }
  }

  async getConfig(denops: Denops): Promise<void> {
    const users = await vars.g.get(
      denops,
      "popup_preview_config",
      {},
    ) as Config;
    this.config = makeConfig(users);
  }

  async onEvent(denops: Denops, event: autocmd.AutocmdEvent): Promise<void> {
    if (event == "InsertEnter") {
      this.onInsertEnter(denops);
    } else {
      if (!this.capabilities) {
        await this.getCapabilities(denops);
      }
      if (event == "TextChangedI" || event == "TextChangedP") {
        this.onTextChanged(denops);
      }
    }
  }

  async onSighelpResponce(denops: Denops, arg: SighelpResponce) {
    await this.sigHandler.showSignatureHelp(
      denops,
      arg,
      this.config,
    );
  }
}
