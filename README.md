# TS Todo

TS Todo is a small todo app for learning fullstack development with TypeScript.
It uses Postgres for the database, Hono for the API, and React for the frontend,
all in one pnpm monorepo.

## Prerequisites

This project uses Node 24 (see `.nvmrc`). The easiest way to get it is fnm:

```sh
# macOS / Linux
brew install fnm    # or: curl -fsSL https://fnm.vercel.app/install | bash

# Windows
winget install Schniz.fnm
```

Then add this to your shell config (`~/.zshrc` or `~/.bashrc`):

```sh
eval "$(fnm env --use-on-cd --version-file-strategy=recursive)"
```

On Windows, add this to your PowerShell profile instead (open it with `notepad $PROFILE`):

```powershell
fnm env --use-on-cd --version-file-strategy=recursive | Out-String | Invoke-Expression
```

Open a new terminal, `cd` into the project, and run `fnm install` once.

Then install pnpm and the project's dependencies:

```sh
npm install --global pnpm
pnpm install
```

You'll also need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or another Docker runtime) to run the database.
