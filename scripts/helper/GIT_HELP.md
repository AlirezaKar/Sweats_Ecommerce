# Git helper scripts (CMD)

Windows **Command Prompt** helpers for push, fetch, new branches, and **Git Flow** merges.

Run from the **repository root** (or any folder — scripts resolve paths from their own directory).

**Requires:** [Git for Windows](https://git-scm.com/) on `PATH`, local `develop` branch, and `main` or `master`.

---

## Git Flow (this repo)

| Branch | What belongs here |
|--------|-------------------|
| **develop** | All day-to-day work — features, bugfixes, release prep |
| **main** / **master** | Production only — finished **releases** and **hotfixes** |

**Do not** commit features on `main` or merge `develop` / `feature/*` / `fix/*` into `main` by hand. The helpers block those merges.

| You want to… | Command | Merge result |
|--------------|---------|--------------|
| Start feature | `git-flow.cmd start-feature my-work` | New `feature/my-work` from **develop** |
| Finish feature | `git-flow.cmd finish-feature my-work` | `feature/*` → **develop** |
| Start bugfix | `git-flow.cmd start-fix login-bug` | New `fix/login-bug` from **develop** |
| Finish bugfix | `git-flow.cmd finish-fix login-bug` | `fix/*` → **develop** |
| Start release | `git-flow.cmd start-release 1.2.0` | New `release/1.2.0` from **develop** |
| Finish release | `git-flow.cmd finish-release 1.2.0` | `release/*` → **main**, then **main** → **develop** |
| Start hotfix | `git-flow.cmd start-hotfix 1.2.1` | New `hotfix/1.2.1` from **main** |
| Finish hotfix | `git-flow.cmd finish-hotfix 1.2.1` | `hotfix/*` → **main**, then **main** → **develop** |

Branches are **not deleted** after finish (safer if something goes wrong).

Print rules anytime:

```cmd
scripts\helper\git-flow.cmd rules
```

---

## Scripts

| File | Purpose |
|------|---------|
| `git-fetch.cmd` | `git fetch --prune` |
| `git-push.cmd` | Push current or named branch |
| `git-new-branch.cmd` | New branch from **develop** (default) |
| `git-flow.cmd` | Git Flow start/finish actions |
| `_git-common.cmd` | Shared routines — do not run directly |

---

## Examples (CMD)

```cmd
cd /d "D:\path\to\Sweats_E_commerce"

REM Fetch
scripts\helper\git-fetch.cmd
scripts\helper\git-fetch.cmd origin

REM Push
scripts\helper\git-push.cmd
scripts\helper\git-push.cmd feature\my-work origin /u

REM New branch (defaults to develop)
scripts\helper\git-new-branch.cmd feature\cart-ui
REM Hotfix branch from main only:
scripts\helper\git-new-branch.cmd hotfix\1.0.1 main origin /frommain

REM Git Flow — status and daily work
scripts\helper\git-flow.cmd status
scripts\helper\git-flow.cmd rules
scripts\helper\git-flow.cmd list

scripts\helper\git-flow.cmd start-feature cart-ui
scripts\helper\git-flow.cmd finish-feature cart-ui

scripts\helper\git-flow.cmd start-fix login-bug
scripts\helper\git-flow.cmd finish-fix login-bug /push

REM Ship release
scripts\helper\git-flow.cmd start-release 1.2.0
scripts\helper\git-flow.cmd finish-release 1.2.0 /remote origin /push

REM Production hotfix
scripts\helper\git-flow.cmd start-hotfix 1.2.1
scripts\helper\git-flow.cmd finish-hotfix 1.2.1 /push
```

### Flags

| Script | Flags |
|--------|--------|
| `git-flow.cmd` | `/push` · `/remote origin` |
| `git-push.cmd` | `/u` (set upstream) |
| `git-new-branch.cmd` | `/frommain` (branch from main/master for hotfixes) |

---

## Typical workflow

```text
develop ── start-feature ──► feature/xyz ── finish-feature ──► develop
develop ── start-fix      ──► fix/abc     ── finish-fix      ──► develop
develop ── start-release  ──► release/1.0 ── finish-release ──► main ──► develop
main    ── start-hotfix   ──► hotfix/1.0.1 ── finish-hotfix  ──► main ──► develop
```

---

## Notes

- Working tree must be **clean** before branch create / finish actions (commit or stash first).
- `finish-*` uses `--no-ff` merges and skips if commits are already included.
- Use `git-fetch.cmd` before starting work if others push to the remote.
