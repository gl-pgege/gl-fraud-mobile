import { Request, Response } from 'express';
import OpenAI from "openai";
import { synthesizeSpeechToFile } from '../utils/synthesizeSpeech';
import path from 'path';
import { handlePlayMessage } from '../utils/call';
import { twiml } from 'twilio';

const openai = new OpenAI();
const fileName = 'voice.mp3';

const { VoiceResponse } = twiml;


export async function handleGatherResponse(req: Request, res: Response) {
    const speechResult = req.body?.SpeechResult; // The speech input (if applicable)
    console.log(`Speech Result: ${speechResult}`);
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are an extremely helpful call assistant. Provide only letters, numbers and punctuation used in regular speech in your response, no markdown" },
            {
                role: "user",
                content: speechResult,
            },
        ],
    });
    
    console.log(completion.choices[0].message);    

    if (completion.choices[0].message.content) {
        await synthesizeSpeechToFile(
            // 'twIdd9EWqLnDdJevmMxZ',
            completion.choices[0].message.content,
            path.join(__dirname, '..', 'public'),
            fileName
        )
        
        res.set('Content-Type', 'text/xml');
        res.status(200).send(handlePlayMessage("https://adapted-calm-crow.ngrok-free.app/voice.mp3"))
        return;
    }
    
    const twimlResponse = new VoiceResponse();
    twimlResponse.hangup();
    res.set('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse.toString());
}
  