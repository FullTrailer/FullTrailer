import ME from 'this.me';
import app from './app';
import { mountApp } from './runtime';
import 'this.gui/style.css';
import './index.css';

const me = ME();

mountApp({ me, app, target: '#root' });
