# denops-signature_help

Shows signature help from lsp server.

## Features

- Works in both Vim and Neovim.
- Support both [vim-lsp](https://github.com/prabirshrestha/vim-lsp) and Neovim builtin lsp.
- Support multiple styles of how to show signature help.

## Screenshots

### Normal

Configuration

```vim
let g:signature_help_config = {
      \ contentsStyle: "full",
      \ viewStyle: "floating"
      \ }
```

![signature_full](https://user-images.githubusercontent.com/63794197/147875944-4c42a238-e538-43b4-872b-a25958f0523c.gif)

### Only labels

Configuration

```vim
let g:signature_help_config = {
      \ contentsStyle: "labels",
      \ viewStyle: "floating"
      \ }
```

![signature_labelOnly](https://user-images.githubusercontent.com/63794197/147875972-9bede4a6-cd3c-4715-a7e5-cb5fb75276c4.png)

### Only current label

Configuration

```vim
let g:signature_help_config = {
      \ contentsStyle: "currentLabel",
      \ viewStyle: "floating"
      \ }
```

![signature_currentLabelOnly](https://user-images.githubusercontent.com/63794197/147875980-8b79c1da-b4f7-463f-a960-2f6fd8e00ff9.gif)

### Virtual text style

Configuration

```vim
let g:signature_help_config = {
      \ contentsStyle: "remainingLabels",
      \ viewStyle: "virtual"
      \ }
```

In Neovim,

![signature_virtual](https://user-images.githubusercontent.com/63794197/147875986-91b47a30-d85f-43aa-ad8b-876c1fcf9739.gif)

In Vim,

![signature_virtual_vim](https://user-images.githubusercontent.com/63794197/147876186-e0588bbf-6bef-4077-bd45-9e28e0d0019c.gif)

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### lsp client

[vim-lsp](https://github.com/prabirshrestha/vim-lsp) or Neovim builtin lsp.

## Install

Use your favorite plugin manager.

## Configuration

For detail, please see [help](doc/signature_help.txt).

```vim
call signature_help#enable()

" if you use with vim-lsp, disable vim-lsp's signature help feature
let g:lsp_signature_help_enabled = 0
```

## TODO

- [ ] add toggle mapping
- [x] support multiple label support
