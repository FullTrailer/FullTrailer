# Operator identity: technical namespace vs. conceptual identity

Decided in conversation, 2026-08-20. Written down because the distinction
is fine enough to lose if it isn't — see `app/src/RootGate.tsx` and
`app/src/views/Landing.tsx` for where this is actually implemented.

## The problem

FullTrailer's own namespace (`fulltrailer.suis-macbook-air.local`) belongs
to the **app/monad**, not to whoever opens a browser tab. An operator
claiming that namespace directly would be claiming the app's own identity —
wrong, the same way a visitor claiming ownership of a building they just
walked into would be wrong.

The correct model has three separate things, not one:

```
operator identity   = jabellae.suis-macbook-air.local   (the person)
app container       = apps.fulltrailer                   (the app's own data root)
app relation         = apps.fulltrailer.operators.jabellae (jabellae, in the
                        context of this app — a fact, not an identity)
```

## Why it isn't implemented that cleanly today

`modules/monad/Typescript/src/kernel/manager.ts`'s `namespaceToKernelPrefix()`
only isolates a claimed namespace into `users.<handle>` (per-operator kernel
storage, cryptographically separated) when the claimed namespace is a DNS
suffix of **that specific monad's own** `ME_NAMESPACE`. FullTrailer's monad
has `ME_NAMESPACE=fulltrailer.suis-macbook-air.local`. So claiming the
conceptually-correct `jabellae.suis-macbook-air.local` against FullTrailer's
monad doesn't match its root — the claim would silently collapse onto the
shared kernel root instead of `users.jabellae`, with **no per-operator
isolation at all**. Confirmed empirically, not assumed.

## What's actually running

```
Technical claim namespace (workaround, never shown to a user):
  <shortHandle>.fulltrailer.suis-macbook-air.local
  → satisfies namespaceToKernelPrefix's DNS-suffix requirement
  → correctly isolates into users.<shortHandle>

Canonical semantic identity (how to reason/document/display):
  <shortHandle>.suis-macbook-air.local

App relation (written explicitly, not encoded in any namespace string):
  apps.fulltrailer.operators.<shortHandle>
  = { handle, identity, lastSeenAt }
```

`<shortHandle>` is the first 8 hex characters of the operator's own
client-generated seed (see `Landing.tsx`) — there's no real multi-user
login yet, just one identity per browser, persisted in `localStorage`
under `fulltrailer.operator.seed:v1` (**not** `this.me.seed:v1` —
`createSeedSession()` scrubs that exact key from storage right after
using it, a collision that silently breaks persistence if reused).

## The framing that produced this (worth keeping)

DNS resolves right-to-left — it finds where to touch the door. Once the
transport pivot (the resolvable host) is found, the remaining left-hand
labels can be read as a `.me` semantic chain applied on top, not as more
DNS. Read as identity, `fulltrailer.suis-macbook-air.local` prefixed with
`jabellae` says "jabellae's identity lives under fulltrailer" — wrong. Read
as a *session/context* namespace, the same string can say "apply jabellae,
in the context of fulltrailer, on this surface" — fine, as long as it's
never confused with the operator's real, canonical identity.

## Tracked debt

Relax `namespaceToKernelPrefix()` to isolate a claim by an **explicit claim
declaration** instead of requiring the claimed namespace to be a DNS suffix
of the monad's own root. Once that lands, the technical and canonical
namespaces above should collapse into one — `jabellae.suis-macbook-air.local`
claimed directly, isolated correctly, no workaround string needed.
