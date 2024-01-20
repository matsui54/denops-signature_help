let s:is_enabled = 0

function! signature_help#enable() abort
  let s:is_enabled = 1
  call s:register_autocmd()
  call s:init_highlight()
endfunction

function s:register_autocmd() abort
  augroup DpsSignatureHelp
    autocmd!
    autocmd TextChangedI,TextChangedP *
          \ call signature_help#notify('onTextChanged', [])
    autocmd InsertEnter *
          \ call signature_help#notify('onInsertEnter', [])
    autocmd CursorMovedI *
          \ call signature_help#notify('onCursorMovedI', [])

    autocmd CursorMoved,InsertLeave *
         \ call signature_help#doc#close_floating()

    autocmd ColorScheme * call <SID>init_highlight()
  augroup END
endfunction

function! s:init_highlight() abort
  highlight default link SignatureHelpDocument NormalFloat
  highlight default link SignatureHelpBorder NormalFloat
  highlight default link SignatureHelpVirtual Error
  highlight default link SignatureHelpGhostText Comment
endfunction

function! signature_help#disable() abort
  let s:is_enabled = 0
  augroup DpsSignatureHelp
    autocmd!
  augroup END
endfunction

function! signature_help#is_enabled() abort
  return s:is_enabled
endfunction

function! signature_help#notify(method, arg) abort
  if denops#plugin#wait('signature_help')
    return
  endif
  call denops#notify('signature_help', a:method, a:arg)
endfunction

function! signature_help#scroll(count) abort
  call signature_help#doc#scroll(a:count)
  return "\<Ignore>"
endfunction
