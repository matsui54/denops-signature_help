local vim = vim
local api = vim.api

local is_new_handler = function(arg)
  -- For neovim 0.6 breaking changes
  -- https://github.com/neovim/neovim/pull/15504
  return vim.fn.has('nvim-0.6') and type(arg) == 'table'
end

local respond = function(item)
  api.nvim_call_function('signature_help#notify', {'respond', {item}})
end

local get_signature_help = function(arg)
  local params = vim.lsp.util.make_position_params()
  vim.lsp.buf_request(0, "textDocument/signatureHelp", params, function(_, arg1, arg2)
    local res = is_new_handler(arg1) and arg1 or arg2
    -- if res and not vim.tbl_isempty(res) and res.signatures and res.signatures[1] then
    --   respond({help = res})
    --   local ft = api.nvim_buf_get_option(0, 'filetype')
    --   local converted, hl = vim.lsp.util.convert_signature_help_to_markdown_lines(res, ft)
    --   respond({help = res, lines = converted, hl = hl, triggers = arg.triggers})
    -- else
    --   respond({help = res})
    -- end
    respond({help = res})
  end)
end

local get_capabilities = function()
  for _, client in pairs(vim.lsp.buf_get_clients()) do
    if client.server_capabilities then
      return client.server_capabilities
    end
  end
  return nil
end

return {
  get_signature_help = get_signature_help,
  get_capabilities = get_capabilities,
}
