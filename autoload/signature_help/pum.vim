function! s:runtimepath(path) abort
  return !empty(globpath(&runtimepath, a:path))
endfunction

let s:has_pum = s:runtimepath('autoload/pum.vim')

function! signature_help#pum#visible() abort
  if s:has_pum
    return pum#visible() || pumvisible()
  else
    return pumvisible()
  endif
endfunction

function! signature_help#pum#info() abort
  if s:has_pum && pum#visible()
    return pum#complete_info()
  else
    return complete_info(["mode", "selected", "items"])
  endif
endfunction

function! signature_help#pum#get_pos() abort
  if s:has_pum && pum#visible()
    return pum#get_pos()
  else
    return pum_getpos()
  endif
endfunction

function! signature_help#pum#skip() abort
  if s:has_pum
    return pum#skip_complete()
  else
    return v:false
  endif
endfunction
