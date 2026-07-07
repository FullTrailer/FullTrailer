import { Typography, Button, Chip } from 'this.gui/atoms';
import { Hero, Stack } from 'this.gui/molecules';
import { useMeAction, useMeValue } from 'this.gui/react';

const heroImage = "https://res.cloudinary.com/dkwnxf6gm/image/upload/v1781493143/entire_vehicle_including_both_the_tractor_and_the_trailer_in_a_unified_minimal_j7nod6.png";

export default function Home() {
  const title = useMeValue<string>('apps.fulltrailer.manifest.title') || 'FullTrailer';
  const units = useMeValue<unknown[]>('apps.fulltrailer.unidades.units') || [];
  const setRoute = useMeAction('apps.fulltrailer.route');

  const goToUnidades = () => setRoute('unidades');
  const goToDiseno = () => { window.location.href = '/rafagas-del-golfo.html'; };

  return (
    <Hero
      backgroundSrc={heroImage}
      backgroundType="image"
      blur="heavy"
      height="100vh"
      mode="left"
      padding={{ xs: 3, md: 8 }}
      contentMaxWidth={680}
    >
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h1" sx={{ color: '#fff' }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ color: '#fff' }}>
          Making Logistics Algorithmic.
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ marginTop: 1 }}>
          <Button variant="contained" size="large" onClick={goToUnidades}>
            Iniciar
          </Button>
          <Button variant="outlined" size="large" onClick={goToDiseno} sx={{ color: '#fff', borderColor: '#fff' }}>
            Diseñar
          </Button>
          <Chip label={`${units.length} unidades configuradas`} variant="outlined" sx={{ color: '#fff', borderColor: '#fff' }} />
        </Stack>
      </Stack>
    </Hero>
  );
}
