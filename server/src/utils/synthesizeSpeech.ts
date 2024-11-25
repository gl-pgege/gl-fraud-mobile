import fs from 'fs';
import path from 'path';
import axios from "axios";
import { voiceData } from './call';

/**
 * Synthesizes speech using the Eleven Labs Text-to-Speech API.
 * 
 * @param {string} apiKey - Your API key for Eleven Labs (passed as the `xi-api-key` header).
 * @param {string} voiceId - The voice ID used in the API URL.
 * @param {string} text - The text to be synthesized into speech.
 * @returns {Promise<Buffer>} - A Promise that resolves to the audio data (as a Buffer).
 */
const synthesizeSpeech = async (voiceId: string, text: string) => {
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
      const headers = {
        'xi-api-key': process.env.ELEVEN_LABS_API_KEY as string,
        'Content-Type': 'application/json',
      };
  
      const data = {
        text: text,
      };
  
      const response = await axios.post(url, data, {
        headers,
        responseType: 'arraybuffer', // Ensures the response is returned as a Buffer (audio file).
      });
  
      return response.data; // This will be the audio data in binary format.
    } catch (error) {
      console.error('Error synthesizing speech:', JSON.stringify(error));
      throw error;
    }
  };
  
  /**
 * Synthesizes speech and saves the audio to a file.
 * 
 * @param {string} apiKey - Your API key for Eleven Labs (passed as the `xi-api-key` header).
 * @param {string} voiceId - The voice ID used in the API URL.
 * @param {string} text - The text to be synthesized into speech.
 * @param {string} outputDir - The directory where the file should be saved.
 * @param {string} fileName - The desired name of the output file (e.g., "output.mp3").
 * @returns {Promise<string>} - A Promise that resolves to the path of the saved audio file.
 */
export const synthesizeSpeechToFile = async (
    // voiceId: string,
    text: string,
    outputDir = './output',
    fileName = 'output.mp3'
): Promise<string> => {
    try {
      // Create the output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
  
      
      // Call synthesizeSpeech to get the audio data
      const audioData = await synthesizeSpeech(voiceData.voiceId, text);
  
      // Define the full file path
      const filePath = path.join(outputDir, fileName);
  
      // Write the audio data to the file
      fs.writeFileSync(filePath, audioData);
  
      console.log(`Audio file saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Failed to synthesize speech to file:', error);
      throw error;
    }
  };


export const listVoices = async () => {
  try {
    const url = `https://api.elevenlabs.io/v1/voices`;

    const headers = {
      'xi-api-key': process.env.ELEVEN_LABS_API_KEY as string,
      'Content-Type': 'application/json',
    };
    const response = await axios.get(url, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error('Error synthesizing speech:', JSON.stringify(error));
    throw error;
  }
};
  