import path from 'path';
import express, { Router } from 'express';
import type { ServerConfig } from './common/types';
import { createTokenRoute } from './routes/token';
import { createTwimlRoute } from './routes/twiml';
import { createLogMiddleware } from './middlewares/log';
import { auth } from 'express-oauth2-jwt-bearer';
import { Request, RequestHandler, Response } from 'express';

import { handleGatherResponse } from './routes/gather';
import { handlePostDial } from './routes/post-dial';
import { addGatherToOngoingConference, voiceData } from './utils/call';
import { handleTranscription } from './routes/transcribe';
import { listVoices } from './utils/synthesizeSpeech';

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

  const gatherRouter = Router();
  gatherRouter.post('/gather-response', (req, res) => handleGatherResponse(req, res));
  app.use(gatherRouter);

  const postDialRouter = Router();
  postDialRouter.post('/post-dial', (req, res) => handlePostDial(req, res));
  app.use(postDialRouter);

  app.post('/call-status', async (req: Request, res: Response) => {
    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus; // Call status (e.g., 'answered', 'completed')
    const gatherActionUrl = 'https://adapted-calm-crow.ngrok-free.app/gather-response';
  
    console.log(`Call SID: ${callSid}, Status: ${callStatus}`);
  
    const conferenceName = 'GatherConferenceRoom';
    await addGatherToOngoingConference(conferenceName, gatherActionUrl);
    try {
      if (callStatus === 'in-progress') {
        console.log(`Gather added to call ${callSid}`);
      }
    } catch (error) {
      console.error('Error handling call status callback:', error);
    }
  
    res.status(200).send('Status received'); // Respond to Twilio
  });  
  
  app.get('/voice-data', async (req: Request, res: Response) => {
    const voices = (await listVoices()).voices.map((voice: any) => {
      return {
        id: voice.voice_id,
        name: voice.name,
      }
    })

    console.log(voices)
    res.status(200).json(voices)
  });  
  
  app.post('/set-voice', async (req: Request, res: Response) => {
    const voiceId = req.body.voiceId;

    voiceData.voiceId = voiceId;
    res.status(200).json({
      success: true
    })
  });  

  return app;
}
