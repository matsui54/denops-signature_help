function s:respond(data) abort
  if lsp#client#is_error(a:data) || !has_key(a:data, 'response') || !has_key(a:data['response'], 'result')
    return
  endif

  call signature_help#notify('respond', [a:data.response.result])
endfunction
function signature_help#vimlsp#request_signature_help() abort
  let servers = filter(lsp#get_allowed_servers(), 'lsp#capabilities#has_signature_help_provider(v:val)')

  if len(servers) == 0
    return
  endif

  call lsp#send_request(servers[0], {
      \ 'method': 'textDocument/signatureHelp',
      \ 'params': {
      \   'textDocument': lsp#get_text_document_identifier(),
      \   'position': lsp#get_position(),
      \ },
      \ 'on_notification': function('s:respond'),
      \ })
endfunction
