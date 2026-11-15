" init preview key action
let s:link_files = {}
let s:link_buffers = {}

function! mkdp#autocmd#init(...) abort
  let l:bufnr = get(a:, 1, bufnr('%'))
  if !a:0 && has_key(s:link_buffers, l:bufnr)
    call remove(s:link_buffers, l:bufnr)
  endif
  execute 'augroup MKDP_REFRESH_INIT' . l:bufnr
    autocmd!
    " refresh autocmd
    if g:mkdp_refresh_slow
      execute 'autocmd CursorHold,BufWrite,InsertLeave <buffer=' . l:bufnr . '> call mkdp#rpc#preview_refresh()'
    else
      execute 'autocmd CursorHold,CursorHoldI,CursorMoved,CursorMovedI <buffer=' . l:bufnr . '> call mkdp#rpc#preview_refresh()'
    endif
    " autoclose autocmd
    if g:mkdp_auto_close && !a:0
      autocmd BufHidden <buffer> call mkdp#rpc#preview_close()
    endif
    " server close autocmd
    autocmd VimLeave * call mkdp#rpc#stop_server()
  augroup END
endfunction

function! mkdp#autocmd#track(name) abort
  let s:link_files[a:name] = 1
  for l:buffer in getbufinfo({'buflisted': 1})
    if l:buffer.name ==# a:name && !exists('#MKDP_REFRESH_INIT' . l:buffer.bufnr . '#CursorHold')
      call mkdp#autocmd#init(l:buffer.bufnr)
      let s:link_buffers[l:buffer.bufnr] = 1
    endif
  endfor
  augroup MKDP_LINK_FILES
    autocmd!
    autocmd BufEnter * call mkdp#autocmd#track_current()
  augroup END
endfunction

function! mkdp#autocmd#track_current() abort
  let l:name = expand('%:p')
  if has_key(s:link_files, l:name)
    call mkdp#autocmd#track(l:name)
  endif
endfunction

function! mkdp#autocmd#clear_links() abort
  augroup MKDP_LINK_FILES
    autocmd!
  augroup END
  for l:bufnr in keys(s:link_buffers)
    execute 'autocmd! MKDP_REFRESH_INIT' . l:bufnr
  endfor
  let s:link_files = {}
  let s:link_buffers = {}
endfunction

function! mkdp#autocmd#clear_buf() abort
  execute 'autocmd! ' . 'MKDP_REFRESH_INIT' . bufnr('%')
endfunction
