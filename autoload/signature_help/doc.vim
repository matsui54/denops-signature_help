let s:Buffer = vital#signature_help#import('VS.Vim.Buffer')
let s:FloatingWindow = vital#signature_help#import('VS.Vim.Window.FloatingWindow')
let s:Window = vital#signature_help#import('VS.Vim.Window')

let s:win = s:FloatingWindow.new()
call s:win.set_var('&wrap', 1)
call s:win.set_var('&conceallevel', 2)
call s:win.set_var('&breakindent', 1)
call s:win.set_var('&linebreak', 1)
call s:win.set_var("&foldenable", 0)

function! s:ensure_buffer() abort
  if !bufexists(s:win.get_bufnr())
    call s:win.set_bufnr(s:Buffer.create())
    call setbufvar(s:win.get_bufnr(), '&buftype', 'nofile')
    call setbufvar(s:win.get_bufnr(), '&buflisted', 0)
    call setbufvar(s:win.get_bufnr(), '&swapfile', 0)
  endif
endfunction

function! signature_help#doc#close_floating(...) abort
  call s:win.close()
  if has('nvim')
    if !exists('s:ns_v')
      let s:ns_v = nvim_create_namespace('dps_signature_help_v')
    endif
    call nvim_buf_clear_namespace(0, s:ns_v, 0, -1)
  endif
endfunction

function! signature_help#doc#get_winid() abort
  return s:win.get_winid()
endfunction

function! signature_help#doc#set_buffer(opts) abort
  call s:ensure_buffer()
  let bufnr = s:win.get_bufnr()
  call setbufline(bufnr, 1, a:opts.lines)
  call setbufvar(bufnr, '&modified', 0)
  call setbufvar(bufnr, '&bufhidden', 'hide')
  return bufnr 
endfunction

function! s:get_namespace() abort
  return nvim_create_namespace("dps_signature_help")
endfunction

" hl: [number, number]
function! signature_help#doc#change_highlight(opts) abort
  let opts = a:opts
  if empty(opts.hl)
    return
  endif
  let bufnr = s:win.get_bufnr()
  if has('nvim')
    let ns = s:get_namespace()
    call nvim_buf_clear_namespace(bufnr, ns, 0, -1)
    if len(opts.hl) == 2
      call nvim_buf_add_highlight(bufnr, ns, "LspSignatureActiveParameter", 0,
            \ opts.hl[0], opts.hl[1])
    endif
  else
    if empty(prop_type_get("dps_signature_help"))
      call prop_type_add("dps_signature_help", {
            \ 'highlight': "Search",
            \ })
    endif
    call prop_add(1, opts.hl[0]+1, {
          \ 'length': opts.hl[1] - opts.hl[0],
          \ 'type': "dps_signature_help",
          \ 'bufnr': bufnr,
          \ })
  endif
endfunction

function! signature_help#doc#update_virtual_text() abort
  if s:win.is_visible()
    let id = s:win.get_winid()
    call popup_setoptions(id, {'col': len(getline('.')) + 5})
  endif
endfunction

function! signature_help#doc#show_virtual_text(opts) abort
  if !exists('*nvim_buf_set_extmark')
    return
  endif

  if !exists('s:ns_v')
    let s:ns_v = nvim_create_namespace('dps_signature_help_v')
  endif

  call nvim_buf_clear_namespace(0, s:ns_v, 0, -1)

  call nvim_buf_set_extmark(
        \ 0, s:ns_v, line('.')-1, col('.')-1, {
        \ 'virt_text': [[a:opts.line, "SignatureHelpVirtual"]],
        \ 'hl_mode': 'combine',
        \ 'priority': 100,
        \ })
  autocmd InsertLeave <buffer> ++once call nvim_buf_clear_namespace(0, s:ns_v, 0, -1)
endfunction

" floatOpt: FloatOption;
" cmds: string[]
" syntax: string
" hl?: [number, number]
" lines: string[]
function! signature_help#doc#show_floating(opts) abort
  if getcmdwintype() !=# ''
    call s:win.close()
    return -1
  endif
  let opts = a:opts
  " call s:ensure_buffer()
  call signature_help#doc#set_buffer(opts)

  let win_opts = opts.floatOpt

  call s:win.open(win_opts)
  " call s:Window.do(s:win.get_winid(), { -> s:apply_syntax(opts) })
  if has_key(opts, 'cmds') && len(opts.cmds)
    call s:Window.do(s:win.get_winid(), { -> execute(join(opts.cmds, "\n"), 'silent') })
  endif

  if has('nvim')
    call s:win.set_var('&winhighlight', 
          \ 'NormalFloat:SignatureHelpDocument,FloatBorder:SignatureHelpBorder')
    if opts.winblend
      call s:win.set_var('&winblend', opts.winblend)
    endif
  endif
  if has_key(opts, 'hl') && opts.hl != v:null && len(opts.hl)
    call signature_help#doc#change_highlight(opts)
  endif
  return s:win.get_winid()
endfunction

function! signature_help#doc#scroll(count) abort
  let ctx = {}
  function! ctx.callback(count) abort
    let info = s:win.info()
    if info is v:null
      return
    endif
    call s:Window.scroll(s:win.get_winid(), info.topline+a:count)
  endfunction
  call timer_start(0, { -> l:ctx.callback(a:count) })
  return "\<Ignore>"
endfunction
