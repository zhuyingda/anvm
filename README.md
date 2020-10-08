# anvm
another nvm, faster and no side effect when your shell launch.

## install

```
npm i -g anvm
```

## usage

To install a specific version nodejs, you can type this:

```
anvm i
```

![](https://raw.githubusercontent.com/zhuyingda/anvm/master/doc/demo-cli-install.gif?raw=true)

Also, to add anvm installed node to your command line, you can do:

### for zsh

```
echo "\nexport PATH=~/.anvm/bin:\$PATH" >> ~/.zshrc
```

### for bash

```
echo "\nexport PATH=~/.anvm/bin:\$PATH" >> ~/.bashrc
```

## support

|  Operation System   | Support  |
|  ----  | ----  |
| MacOS  | ✅ |
| Linux  | ❌ |
| Windows  | ❌ |

## License

[GPL-V3](http://www.gnu.org/licenses/)

Copyright (c) 2020-present, 5u9ar
