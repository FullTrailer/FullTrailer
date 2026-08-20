import { useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Button, Progress } from 'this.gui/atoms';
import { useSeedSession } from 'this.gui/react';
import { seedFullTrailerCatalog } from '../data/seedCatalog';

// NOT this.me.seed:v1 — createSeedSession() scrubs that exact key from
// localStorage right after using it (a different, pre-existing convention),
// which would silently wipe our persisted seed on every login.
const SEED_STORAGE_KEY = 'fulltrailer.operator.seed:v1';
const MONAD_ROOT_NAMESPACE = 'fulltrailer.suis-macbook-air.local';

function readOrCreateSeed(): string {
  const existing = window.localStorage.getItem(SEED_STORAGE_KEY);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const seed = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  window.localStorage.setItem(SEED_STORAGE_KEY, seed);
  return seed;
}

/**
 * Session entry point — establishes the real .me hash chemistry (seed ->
 * identity -> claim/open -> replay of kernel memories) before the actual
 * app ever mounts.
 *
 * Namespace design (decided in conversation, 2026-08-20): the operator's
 * identity must never be claimed under FullTrailer's OWN root namespace
 * directly (that namespace belongs to the monad/app itself, not to whoever
 * opens a browser tab) — but today's kernel (namespaceToKernelPrefix in
 * modules/monad) only isolates a claim into users.<handle> when the claimed
 * namespace ends with THIS monad's own ME_NAMESPACE. So:
 *
 *   technical claim namespace (workaround, invisible to the user):
 *     <shortHandle>.fulltrailer.suis-macbook-air.local
 *   canonical semantic identity (how this should be documented/reasoned about):
 *     <shortHandle>.suis-macbook-air.local
 *   app relation (recorded separately, not encoded in the namespace at all):
 *     apps.fulltrailer.operators.<shortHandle>
 *
 * TODO / tracked debt: namespaceToKernelPrefix should isolate by an
 * explicit claim declaration, not by requiring the claimed string to be a
 * DNS suffix of the monad's own root — once that's relaxed, the technical
 * and canonical namespaces above should collapse into one.
 */
export default function Landing() {
  const { loginWithSeed, activateSession, status, pending, error, clearError } = useSeedSession();
  const attempted = useRef(false);

  const enter = async () => {
    const seed = readOrCreateSeed();
    const handle = seed.slice(0, 8);
    const technicalNamespace = `${handle}.${MONAD_ROOT_NAMESPACE}`;

    const session = await loginWithSeed({ seed, namespace: technicalNamespace, autoOpen: false });
    try {
      await session.open(technicalNamespace);
    } catch {
      // First visit from this browser — no claim exists yet.
      await session.claimAndOpen(technicalNamespace);
    }
    await seedFullTrailerCatalog(session);
    await session.write(`apps.fulltrailer.operators.${handle}`, {
      handle,
      identity: `${handle}.suis-macbook-air.local`,
      lastSeenAt: Date.now(),
    });
    activateSession(session);
  };

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    enter().catch(() => {
      // status/error already reflect the failure via SeedSessionProvider.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    clearError();
    attempted.current = false;
    enter().catch(() => {});
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <Card sx={{ maxWidth: 360, width: '100%' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            FullTrailer
          </Typography>

          {status === 'error' ? (
            <>
              <Typography variant="body2" sx={{ color: 'error.main', textAlign: 'center' }}>
                {error?.message || 'No se pudo iniciar sesión.'}
              </Typography>
              <Button variant="contained" onClick={retry}>
                Reintentar
              </Button>
            </>
          ) : (
            <>
              <Progress kind="circular" size={28} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {pending ? 'Iniciando sesión…' : 'Conectando…'}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
