import app from './app.js';
import { serverEnv } from './config/env.js';

app.listen(serverEnv.port, serverEnv.host, () => {
  console.log(`Copiloto API escuchando en http://${serverEnv.host}:${serverEnv.port}`);
});
