import Home from './views/Home';
import UnitsConfig from './views/UnitsConfig';
import Tractos from './views/Tractos';
import Operadores from './views/Operadores';
import Remolques from './views/Remolques';
import Dollies from './views/Dollies';
import Facturas from './views/Facturas';

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
    remolques: Remolques,
    dollies: Dollies,
    facturas: Facturas,
  },
};

export default app;
