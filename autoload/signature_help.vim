let s:is_enabled = 0

function! signature_help#enable() abort
  if denops#plugin#is_loaded('signature_help')
    return
  endif
  let s:is_enabled = 1

  augroup DpsSignatureHelp
    autocmd!
  augroup END
  if exists('g:loaded_denops') && denops#server#status() ==# 'running'
    silent! call s:register()
  else
    autocmd DpsSignatureHelp User DenopsReady ++once silent! call s:register()
  endif
endfunction

let s:root_dir = fnamemodify(expand('<sfile>'), ':h:h')
function! s:register() abort
  call denops#plugin#register('signature_help',
        \ denops#util#join_path(s:root_dir, 'denops', 'signature_help', 'app.ts'),
        \ { 'mode': 'reload' })
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

    autocmd CursorMoved,InsertLeave * 
         \ call signature_help#doc#close_floating()

    autocmd ColorScheme * call <SID>init_highlight()
  augroup END
endfunction

function! s:init_highlight() abort
  highlight default link SignatureHelpDocument NormalFloat
  highlight default link SignatureHelpBorder NormalFloat
  highlight default link SignatureHelpVirtual Error
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
