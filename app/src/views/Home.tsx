import { Typography, Button } from 'this.gui/atoms';
import { Hero, Stack } from 'this.gui/molecules';
import { useMeValue } from 'this.gui/react';

const heroImage = "https://res.cloudinary.com/dkwnxf6gm/image/upload/v1781493143/entire_vehicle_including_both_the_tractor_and_the_trailer_in_a_unified_minimal_j7nod6.png";

export default function Home() {
  const title = useMeValue<string>('apps.fulltrailer.manifest.title') || 'FullTrailer';

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
        <Typography variant="h1">{title}</Typography>
        <Typography variant="h5">
         Making Logistics Algorithmic.
        </Typography>
        <Button variant="contained" size="large">
          Get started
        </Button>
      </Stack>
    </Hero>
  );
}
