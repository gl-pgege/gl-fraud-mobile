import { Request, Response } from 'express';
import { log } from '../utils/log';
import OpenAI from "openai";
import { synthesizeSpeechToFile } from '../utils/synthesizeSpeech';
import path from 'path';
import { playMessageInCall } from '../utils/call';

const openai = new OpenAI();

export const handleTranscription = async (req: Request, res: Response) => {
  const event = req.body.TranscriptionEvent;
  const transcriptionSid = req.body.TranscriptionSid;
  const callSid = req.body.CallSid;
  const timestamp = req.body.Timestamp;
  const accountSid = req.body.AccountSid;

  log(`Transcription Event: ${event}`);
  log(`CallSid: ${callSid}, TranscriptionSid: ${transcriptionSid}, Timestamp: ${timestamp}`);

  switch (event) {
    case 'transcription-started':
      handleTranscriptionStarted(req.body);
      break;

    case 'transcription-content':
      await handleTranscriptionContent(req.body, callSid);
      break;

    case 'transcription-stopped':
      handleTranscriptionStopped(req.body);
      break;

    case 'transcription-error':
      handleTranscriptionError(req.body);
      break;

    default:
      log(`Unhandled Transcription Event: ${event}`);
  }

  res.status(200).send('Event Received');
};

const handleTranscriptionStarted = (data: any) => {
    log(`Transcription Started: ${data.TranscriptionSid}`);
    log(`Provider Configuration: ${data.ProviderConfiguration}`);
};
  
const handleTranscriptionContent = async (data: any, callSid: string) => {
    const transcription = JSON.parse(data.TranscriptionData);
    console.log(data)
    log(`Transcription Content: ${transcription.transcript}`);
    log(`Confidence: ${transcription.confidence}`);
    log(`Final: ${data.Final}`);
    log(`CallSid: ${callSid}`);

    // const callSid = callStore['callSid'];
    // if (!callSid) return;

    // if (data.Final) {
    //     const completion = await openai.chat.completions.create({
    //         model: "gpt-4o-mini",
    //         messages: [
    //             { role: "system", content: "You are an extremely helpful call assistant" },
    //             {
    //                 role: "user",
    //                 content: `${transcription.transcript}`,
    //             },
    //         ],
    //     });
        
    //     console.log(completion.choices[0].message);    

    //     if (completion.choices[0].message.content) {
    //         await synthesizeSpeechToFile(
    //             'sk_802fdc2b4205b193c9a0ec92e4e7491259934a20e21b741d',
    //             'twIdd9EWqLnDdJevmMxZ',
    //             completion.choices[0].message.content,
    //             path.join(__dirname, '..', 'public'),
    //             'voice.mp3'
    //         )

    //         await playMessageInCall(callSid, "https://adapted-calm-crow.ngrok-free.app/voice.mp3")
    //     }
    // }
};
  
const handleTranscriptionStopped = (data: any) => {
    log(`Transcription Stopped: ${data.TranscriptionSid}`);
};

const handleTranscriptionError = (data: any) => {
    log(`Transcription Error: ${data.TranscriptionError}`);
    log(`Error Code: ${data.TranscriptionErrorCode}`);
};
