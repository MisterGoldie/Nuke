# Run locally without installing Node.js LTS

If you **cannot** install Node from nodejs.org, use the scripts in this folder. They use:

1. **Cursor’s built-in Node** (when you run from Cursor’s terminal), or  
2. **Portable Node** (optional zip download, no admin installer), or  
3. **Yarn already bundled** in `.yarn/releases/` (no global Yarn needed)

You do **not** need `npm` or a system `yarn` command.

---

## Quick start (recommended)

Open **PowerShell in Cursor** (Terminal → New Terminal), then:

```powershell
cd "C:\Users\Otto Resident\Downloads\Nuke-main\Nuke-main"
.\scripts\install.ps1
.\scripts\dev.ps1
```

Open **http://localhost:3000**

If Windows blocks scripts once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## If Cursor’s Node is not found

Download a **portable** Node zip (not the LTS installer):

```powershell
cd "C:\Users\Otto Resident\Downloads\Nuke-main\Nuke-main"
.\scripts\setup-portable-node.ps1
.\scripts\install.ps1
.\scripts\dev.ps1
```

That saves Node under `.tools/node/` inside the project (no admin).

If **nodejs.org is blocked** on your network, on another computer download:

https://nodejs.org/dist/v22.16.0/node-v22.16.0-win-x64.zip

Extract so this file exists:

`Nuke-main\.tools\node\node.exe`

Then run `.\scripts\install.ps1` and `.\scripts\dev.ps1`.

---

## Can’t run anything locally?

Deploy free on [Vercel](https://vercel.com): connect the repo, build command `yarn build` or `npm run build`, output Next.js. You get a public URL without installing Node on this PC.

---

## npm vs Yarn

`package.json` works with npm if you get Node later. These scripts use **bundled Yarn** so you don’t need npm on PATH.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `EPERM: operation not permitted, unlink` | A dev server or Node process locked `node_modules`. Ctrl+C to stop it, then run `.\scripts\clean-install.ps1` |
| `Couldn't find the node_modules state file` | Install did not finish — run `.\scripts\clean-install.ps1`, then `.\scripts\dev.ps1` |
| Peer dependency warnings during install | Usually safe to ignore for local dev |
