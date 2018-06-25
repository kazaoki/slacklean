# slacklean

log clear for slack.com

Say "スラックリーン".

## Install

```sh
npm i slacklean -g
```

or

```sh
yarn gloabl add slacklean
```

## Usage

```sh
$ slacklean --token XXXXXXXXXXXXXXXXXX --channel my-secret-room
```

or

```sh
$ slacklean -t XXXXXXXXXXXXXXXXXX -c my-secret-room
```

A legacy token is required.

- [Legacy tokens](https://api.slack.com/custom-integrations/legacy-tokens)

`slacklean -h` for detail.

## Arguments

| arg | short | desc | desc-ja |
| --- | --- | --- | --- | --- |
| `--token` | `-t` | Specify a legacy token (required) | Slackのレガシートークンを指定（必須） |
| `--channel` | `-c` | Specify a channel name | チャンネル名を指定 |
| `--not-delete-files` | `-n` | Do not delete attached files | 添付ファイルは削除しない |
| `--version` | `-v` | Show version | バージョン表示 |
| `--help` | `-h` | Show help | ヘルプ表示 |

## License
MIT
