import Home from './views/Home';
import UnitsConfig from './views/UnitsConfig';
import Tractos from './views/Tractos';
import Operadores from './views/Operadores';

const app = {
  id: 'fulltrailer',
  namespace: 'apps.fulltrailer',
  title: 'FullTrailer',
  theme: 'neurons.me',
  views: {
    home: Home,
    unidades: UnitsConfig,
    tractos: Tractos,
    operadores: Operadores,
  },
};

export default app;
