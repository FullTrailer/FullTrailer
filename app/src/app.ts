import Home from './views/Home';
import UnitsConfig from './views/UnitsConfig';
import Tractos from './views/Tractos';

const app = {
  id: 'fulltrailer',
  namespace: 'apps.fulltrailer',
  title: 'FullTrailer',
  theme: 'neurons.me',
  views: {
    home: Home,
    unidades: UnitsConfig,
    tractos: Tractos,
  },
};

export default app;
