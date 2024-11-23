import twilio from "twilio";

// Use environment variables for authentication
const accountSid = process.env.ACCOUNT_SID as string; // Type assertion ensures TypeScript knows these exist
const authToken = process.env.AUTH_TOKEN as string;
const client = twilio(accountSid, authToken);

/**
 * Plays an audio message in an ongoing call.
 *
 * @param {string} callSid - The SID of the ongoing call.
 * @param {string} audioUrl - The URL of the audio file to play.
 * @returns {Promise<void>} - Resolves when the update is successful.
 * @throws {Error} - Throws an error if the update fails.
 */
export async function playMessageInCall(callSid: string, audioUrl: string): Promise<void> {
  try {
    // Update the call with TwiML to play the audio file
    await client.calls(callSid).update({
      twiml: `<Response><Play>${audioUrl}</Play></Response>`,
    });

    console.log(`Audio file ${audioUrl} is now playing in call ${callSid}.`);
  } catch (error: any) {
    console.error(`Failed to play message in call ${callSid}:`, error.message);
    throw new Error(`Error playing message in call: ${error.message}`);
  }
}
