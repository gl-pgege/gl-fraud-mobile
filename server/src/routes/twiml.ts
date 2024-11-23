import { Request, RequestHandler, Response } from 'express';
import { twiml, validateExpressRequest } from 'twilio';
import { ServerConfig } from '../common/types';
import { log } from '../utils/log';

export function createTwimlRoute(
  serverConfig: ServerConfig,
): RequestHandler {
  const { VoiceResponse } = twiml;

  const logMsg = (msg: string) => {
    log(`/twiml ${msg}`);
  };

  return function twimlRoute(req: Request, res: Response) {
    const requestIsValid = validateExpressRequest(req, serverConfig.AUTH_TOKEN);

    if (!requestIsValid) {
      const msg = 'Unauthorized Twilio signature';
      logMsg(msg);
      res.status(401).send(msg);
      return;
    }

    console.log("call body", req.body)

    const { To: to } = req.body;
    if (typeof to !== 'string') {
      const msg = 'Missing "To".';
      logMsg(msg);
      res.status(400).send(msg);
      return;
    }

    const recipientType = (['client', 'number'] as const).find(
      (r) => r === req.body.recipientType,
    );
    if (typeof recipientType === 'undefined') {
      const msg = 'Invalid "recipientType".';
      logMsg(msg);
      res.status(400).send(msg);
      return;
    }

    const callerId =
      recipientType === 'number' ? serverConfig.CALLER_ID : req.body.From;

    const twimlResponse = new VoiceResponse();

    // Start real-time transcription (Media Streams)
    const start = twimlResponse.start()
    
    start.transcription({
      // where the transcribed audio should go to.
      statusCallbackUrl: 'https://adapted-calm-crow.ngrok-free.app/transcribe',
      track: 'inbound_track'
    });

    // Dial number
    const dial = twimlResponse.dial({
      answerOnBridge: true,
      callerId,
    });
    dial[recipientType](to);

    // instructions for twilio on what to do for this app
    console.log(twimlResponse.toString());
    res
      .header('Content-Type', 'text/xml')
      .status(200)
      .send(twimlResponse.toString());
  };
}
