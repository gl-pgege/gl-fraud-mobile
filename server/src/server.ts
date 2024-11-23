import path from 'path';
import express, { Router } from 'express';
import type { ServerConfig } from './common/types';
import { createTokenRoute } from './routes/token';
import { createTwimlRoute } from './routes/twiml';
import { createLogMiddleware } from './middlewares/log';
import { auth } from 'express-oauth2-jwt-bearer';
import { handleTranscription } from './routes/transcribe';

export function createExpressApp(serverConfig: ServerConfig) {
  const app = express();

  const jwtCheck = auth({
    audience: serverConfig.AUTH0_AUDIENCE,
    issuerBaseURL: serverConfig.AUTH0_ISSUER_BASE_URL,
  });

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  /**
   * When testing locally using a tool like `ngrok`, `ngrok` acts as a proxy in
   * front of this `express` app.
   *
   * Configure the following line according to your environment, development or
   * production.
   *
   * Please see the official Express documentation for more information.
   * https://expressjs.com/en/guide/behind-proxies.html
   */
  app.set('trust proxy', 1);

  app.use(createLogMiddleware());

  // Serve static files from the "public" directory
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  const tokenRouter = Router();
  tokenRouter.use(createTokenRoute(serverConfig));
  app.post('/token', jwtCheck, tokenRouter);

  const twimlRouter = Router();
  twimlRouter.use(createTwimlRoute(serverConfig));
  app.post('/twiml', twimlRouter);

  const transcribeRouter = Router();
  transcribeRouter.post('/transcribe', (req, res) => handleTranscription(req, res));
  app.use(transcribeRouter);

  return app;
}
