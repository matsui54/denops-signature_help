# denops-signature.vim
Shows signature help from lsp server.

## Features
- works in both Vim and Neovim
- support both [vim-lsp](https://github.com/prabirshrestha/vim-lsp) and [ddc-nvim-lsp](https://github.com/Shougo/ddc-nvim-lsp)
- support multiple styles of how to show signature help 

## Screenshots
### `style = full`
### `style = labelOnly`
### `style = currentLabelOnly`
### `style = virtual`

## Required

### denops.vim
https://github.com/vim-denops/denops.vim

### lsp client
- [vim-lsp](https://github.com/prabirshrestha/vim-lsp)
- [ddc-nvim-lsp](https://github.com/Shougo/ddc-nvim-lsp)

## Install
Use your favorite plugin manager.

## Configuration
For detail, please see [help](doc/signature_help.txt).
```vim
call signature_help#enable()
```

## TODO
- add toggle mapping
- support multiple label support
