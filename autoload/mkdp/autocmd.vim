let s:link_refresh_bufnrs = []
let s:link_watch_files = []

" declare the watch group at load time so stop_link_preview can clear it even
" when no disk-backed link file was ever watched
augroup MKDP_LINK_FILE_WATCH
augroup END

" refresh events shared by the explicit preview and link preview autocmds
function! s:refresh_events() abort
  if g:mkdp_refresh_slow
    return 'CursorHold,BufWrite,InsertLeave'
  endif
  return 'CursorHold,CursorHoldI,CursorMoved,CursorMovedI'
endfunction

" init preview key action
function! mkdp#autocmd#init() abort
  execute 'augroup MKDP_REFRESH_INIT' . bufnr('%')
    autocmd!
    " refresh autocmd
    execute 'autocmd ' . s:refresh_events() . ' <buffer> call mkdp#rpc#preview_refresh()'
    " autoclose autocmd
    if g:mkdp_auto_close
      autocmd BufHidden <buffer> call mkdp#rpc#preview_close()
    endif
    " server close autocmd
    autocmd VimLeave * call mkdp#rpc#stop_server()
  augroup END
endfunction

" register the refresh autocmd for a buffer opened from a link preview.
" unlike mkdp#autocmd#init() this never closes the page on BufHidden and
" leaves the autocmds of an explicit preview of the same buffer untouched.
function! mkdp#autocmd#init_link_preview(bufnr) abort
  if index(s:link_refresh_bufnrs, a:bufnr) ==# -1
    call add(s:link_refresh_bufnrs, a:bufnr)
  endif
  execute 'augroup MKDP_LINK_REFRESH' . a:bufnr
    autocmd!
    execute 'autocmd ' . s:refresh_events() . ' <buffer=' . a:bufnr . '> call mkdp#rpc#preview_refresh(' . a:bufnr . ')'
  augroup END
endfunction

" watch a link target that has no buffer yet, so the refresh autocmd is
" registered when the user opens the file later
function! mkdp#autocmd#watch_link_file(path) abort
  if index(s:link_watch_files, a:path) ==# -1
    call add(s:link_watch_files, a:path)
  endif
  augroup MKDP_LINK_FILE_WATCH
    autocmd!
    autocmd BufReadPost * call s:link_file_read(expand('<afile>:p'))
  augroup END
endfunction

function! s:link_file_read(path) abort
  if index(s:link_watch_files, a:path) !=# -1
    let l:bufnr = bufnr(a:path)
    if l:bufnr !=# -1
      call mkdp#autocmd#init_link_preview(l:bufnr)
    endif
  endif
endfunction

function! mkdp#autocmd#stop_link_preview() abort
  for l:bufnr in s:link_refresh_bufnrs
    execute 'autocmd! MKDP_LINK_REFRESH' . l:bufnr
  endfor
  let s:link_refresh_bufnrs = []
  let s:link_watch_files = []
  autocmd! MKDP_LINK_FILE_WATCH
endfunction

function! mkdp#autocmd#clear_buf() abort
  execute 'autocmd! ' . 'MKDP_REFRESH_INIT' . bufnr('%')
endfunction
