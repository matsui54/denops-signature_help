# denops-signature.vim
Shows signature help from lsp server.

## Features
- works in both Vim and Neovim
- support both [vim-lsp](https://github.com/prabirshrestha/vim-lsp) and [ddc-nvim-lsp](https://github.com/Shougo/ddc-nvim-lsp)
- support multiple styles of how to show signature help 

## Screenshots
### `style = full`
![signature_full](https://user-images.githubusercontent.com/63794197/147875944-4c42a238-e538-43b4-872b-a25958f0523c.gif)

### `style = labelOnly`
![signature_labelOnly](https://user-images.githubusercontent.com/63794197/147875972-9bede4a6-cd3c-4715-a7e5-cb5fb75276c4.png)

### `style = currentLabelOnly`
![signature_currentLabelOnly](https://user-images.githubusercontent.com/63794197/147875980-8b79c1da-b4f7-463f-a960-2f6fd8e00ff9.gif)

### `style = virtual`
In Neovim,

![signature_virtual](https://user-images.githubusercontent.com/63794197/147875986-91b47a30-d85f-43aa-ad8b-876c1fcf9739.gif)

In Vim,

![signature_virtual_vim](https://user-images.githubusercontent.com/63794197/147876186-e0588bbf-6bef-4077-bd45-9e28e0d0019c.gif)


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
