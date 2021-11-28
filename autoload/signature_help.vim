let s:root_dir = fnamemodify(expand('<sfile>'), ':h:h')
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

function! signature_help#disable() abort
  let s:is_enabled = 0
  augroup DpsSignatureHelp
    autocmd!
  augroup END
endfunction

function! s:register() abort
  call denops#plugin#register('signature_help',
        \ denops#util#join_path(s:root_dir, 'denops', 'signature_help', 'app.ts'),
        \ { 'mode': 'reload' })
endfunction

function! signature_help#is_enabled() abort
  return s:is_enabled
endfunction

function! s:denops_running() abort
  return exists('g:loaded_denops')
        \ && denops#server#status() ==# 'running'
        \ && denops#plugin#is_loaded('signature_help')
endfunction

function! signature_help#notify(method, arg) abort
  if s:denops_running()
    call denops#notify('signature_help', a:method, a:arg)
  endif
endfunction

function! signature_help#scroll(count) abort
  call signature_help#doc#scroll(a:count)
  return "\<Ignore>"
endfunction
