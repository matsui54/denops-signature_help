" retrieved from vim-vsnip-integ
" https://github.com/hrsh7th/vim-vsnip-integ
let s:definition = {
\   'vimlsp': { -> exists('g:lsp_loaded') },
\ }


let s:cache = {}

"
" vsnip_integ#detection#definition
"
function! vsnip_integ#detection#definition() abort
  return copy(s:definition)
endfunction

"
" vsnip_integ#detection#exists
"
function! vsnip_integ#detection#exists(id) abort
  if !has_key(s:cache, a:id)
    let s:cache[a:id] = s:definition[a:id]()
  endif
  return s:cache[a:id]
endfunction

"
" runtimepath
"
function! s:runtimepath(path) abort
  return !empty(globpath(&runtimepath, a:path))
endfunction


