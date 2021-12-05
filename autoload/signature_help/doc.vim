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

function! signature_help#doc#close_floating(opts) abort
  call s:win.close()
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
  let bufnr = s:win.get_bufnr()
  let ns = s:get_namespace()
  if has('nvim')
    call nvim_buf_clear_namespace(bufnr, ns, 0, -1)
    if len(opts.hl) == 2
      call nvim_buf_add_highlight(bufnr, ns, "LspSignatureActiveParameter", 0,
            \ opts.hl[0], opts.hl[1])
    endif
  endif
endfunction

" floatOpt: FloatOption;
" events: autocmd.AutocmdEvent[];
" width: number;
" height: number;
" cmds: string[]
" syntax: string
" hl: [number, number]
function! signature_help#doc#show_floating(opts) abort
  if getcmdwintype() !=# ''
    call s:win.close()
    return -1
  endif
  let opts = a:opts
  " call s:ensure_buffer()
  call signature_help#doc#set_buffer(opts)

  let win_opts = opts.floatOpt
  let win_opts.width = opts.width
  let win_opts.height = opts.height

  call s:win.open(win_opts)
  " call s:Window.do(s:win.get_winid(), { -> s:apply_syntax(opts) })
  if has_key(opts, 'cmds') && len(opts.cmds)
    call s:Window.do(s:win.get_winid(), { -> execute(join(opts.cmds, "\n"), 'silent') })
  endif

  if has('nvim')
    call s:win.set_var('&winhighlight', 'NormalFloat:PopupPreviewDocument,FloatBorder:PopupPreviewBorder')
    if opts.winblend
      call s:win.set_var('&winblend', opts.winblend)
    endif
  endif
  call signature_help#doc#change_highlight(opts)
  if len(opts.events)
    execute printf("autocmd %s <buffer> ++once call signature_help#doc#close_floating({})",
          \ join(opts.events, ','))
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
