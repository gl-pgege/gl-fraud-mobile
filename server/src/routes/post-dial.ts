import { Request, Response } from 'express';
import { twiml } from 'twilio';

const { VoiceResponse } = twiml;


export async function handlePostDial(req: Request, res: Response) {
    const twimlResponse = new VoiceResponse();
    // Start a gather after dialing
    twimlResponse.gather({
      input: ['speech'],
      action: 'https://adapted-calm-crow.ngrok-free.app/gather-response',
      timeout: 2,
    })
    
    res.set('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse.toString());
}
  