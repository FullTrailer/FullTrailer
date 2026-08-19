#!/usr/bin/env bash
# Runs FullTrailer's monad: the shared, unmodified modules/monad/Typescript
# daemon (all.this checkout), configured via this directory's .env/self.json
# rather than copied into this repo. See ../README.md (or AGENTS context) for
# why — monad.ai stays a generic, reusable daemon; this app only supplies
# its own namespace identity + kernel state directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Default assumes apps/FullTrailer and all.this are sibling checkouts (this
# repo's own layout). Override MONAD_REPO_DIR if yours differs.
MONAD_DIR="${MONAD_REPO_DIR:-$SCRIPT_DIR/../../../all.this/modules/monad/Typescript}"

if [ ! -d "$MONAD_DIR" ]; then
  echo "monad daemon not found at $MONAD_DIR — set MONAD_REPO_DIR to your all.this/modules/monad/Typescript checkout." >&2
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Missing $SCRIPT_DIR/.env — copy .env.example to .env and fill in SEED/ME_NAMESPACE first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$SCRIPT_DIR/.env"
set +a

cd "$MONAD_DIR"
exec npx tsx watch server.ts
