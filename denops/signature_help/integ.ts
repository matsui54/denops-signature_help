import { Denops, fn, gather } from "./deps.ts";
import { ServerCapabilities } from "./types.ts";

let lspType: "vimlsp" | "nvimlsp" | null;

export async function getServerCapabilities(
  denops: Denops,
): Promise<ServerCapabilities[] | null> {
  if (await fn.exists(denops, "*lsp#get_allowed_servers")) {
    const servers = await denops.call("lsp#get_allowed_servers") as string[];
    if (servers.length) {
      lspType = "vimlsp";
      return await gather(denops, async (denops) => {
        for (const server of servers) {
          await denops.call(
            "lsp#get_server_capabilities",
            server,
          );
        }
      }) as ServerCapabilities[];
    }
  }
  if (await fn.has(denops, "nvim")) {
    lspType = "nvimlsp";
    return await denops.call(
      "luaeval",
      "require('signature_help.nvimlsp').get_capabilities()",
    ) as ServerCapabilities[];
  }
  lspType = null;
  return null;
}

export async function requestSignatureHelp(
  denops: Denops,
): Promise<void> {
  if (lspType == "vimlsp") {
    await denops.call("signature_help#vimlsp#request_signature_help");
  } else if (lspType == "nvimlsp") {
    await denops.call(
      "luaeval",
      "require('signature_help.nvimlsp').request_signature_help()",
    );
  }
}
