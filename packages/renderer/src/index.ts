import App from '/@/App.vue';

import { createApp } from './runtime-dom';
import {getRootContainer} from './game';

const app = createApp(App);
app.mount(getRootContainer());

window.console.warn = () => {};

