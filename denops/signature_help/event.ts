import { Denops, fn, vars } from "./deps.ts";
import { ServerCapabilities, SignatureHelp } from "./types.ts";
import { Config, makeConfig } from "./config.ts";
import { SigHandler } from "./signature.ts";
import { getServerCapabilities } from "./integ.ts";

const defaultTriggerCharacters = [",", "(", "<", "["];
const triggerCloseCharacters = [")", ">", "]"];

function has_capability(capabilities: ServerCapabilities[] | null) {
  if (!capabilities) {
    return false;
  }
  for (const cap of capabilities) {
    if (cap.signatureHelpProvider) {
      return true;
    }
  }
  return false;
}

function getTriggerCharacters(capabilities: ServerCapabilities[]) {
  const triggers = [];
  for (const cap of capabilities) {
    if (cap.signatureHelpProvider?.triggerCharacters) {
      triggers.push(...cap.signatureHelpProvider.triggerCharacters);
    }
  }
  const triggerCharacters = triggers.length > 0
    ? triggers
    : defaultTriggerCharacters;
  return triggerCharacters.concat(triggerCloseCharacters);
}

export class EventHandler {
  private config: Config = {} as Config;
  private sigHandler = new SigHandler();
  private capabilities: ServerCapabilities[] | null = null;

  private async getConfig(denops: Denops): Promise<void> {
    const users = await vars.g.get(
      denops,
      "signature_help_config",
      {},
    ) as Config;
    this.config = makeConfig(users);
  }

  async onInsertEnter(denops: Denops): Promise<void> {
    await this.getConfig(denops);
    this.sigHandler.onInsertEnter();
    this.capabilities = await getServerCapabilities(denops);
    if (has_capability(this.capabilities)) {
      this.sigHandler.requestSighelp(denops, defaultTriggerCharacters);
    }
  }

  async onTextChanged(denops: Denops): Promise<void> {
    if (!this.capabilities) {
      this.capabilities = await getServerCapabilities(
        denops,
      ) as ServerCapabilities[];
    }
    if (!has_capability(this.capabilities)) {
      return;
    }
    const triggerCharacters = getTriggerCharacters(this.capabilities);

    const cursorCol = await fn.col(denops, ".");
    const line = await fn.getline(denops, ".");
    if (
      triggerCharacters.includes(line[cursorCol - 2])
    ) {
      this.sigHandler.requestSighelp(denops, triggerCharacters);
    } else if (this.config.onTriggerChar) {
      if (
        !triggerCharacters.includes(
          line.slice(0, cursorCol - 1).trim().slice(-1),
        )
      ) {
        this.sigHandler.closeWin(denops);
      }
    } else if (this.config.viewStyle == "virtual") {
      if (!(await fn.has(denops, "nvim"))) {
        await denops.call("signature_help#doc#update_virtual_text");
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
