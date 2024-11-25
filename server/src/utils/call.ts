import twilio from "twilio";
import { twiml } from 'twilio';

// Use environment variables for authentication
const accountSid = process.env.ACCOUNT_SID as string; // Type assertion ensures TypeScript knows these exist
const authToken = process.env.AUTH_TOKEN as string;
const client = twilio(accountSid, authToken);

export const voiceData = {
  voiceId: ''
}

const { VoiceResponse } = twiml;

/**
 * Plays an audio message in an ongoing call.
 *
 * @param {string} callSid - The SID of the ongoing call.
 * @param {string} audioUrl - The URL of the audio file to play.
 * @returns {Promise<void>} - Resolves when the update is successful.
 * @throws {Error} - Throws an error if the update fails.
 */
export async function playMessageInCall(callSid: string, audioUrl: string): Promise<void> {
  const twimlResponse = new VoiceResponse();
  
  twimlResponse.play(audioUrl);
  twimlResponse.pause({
    length: 20,
  });
  try {
    // Update the call with TwiML to play the audio file
    await client.calls(callSid).update({
      twiml: twimlResponse.toString(),
    });

    console.log(`Audio file ${audioUrl} is now playing in call ${callSid}.`);
  } catch (error: any) {
    console.error(`Failed to play message in call ${callSid}:`, error.message);
    throw new Error(`Error playing message in call: ${error.message}`);
  }
}
/**
 * Plays an audio message in an ongoing call.
 *
 * @param {string} conferenceId - The SID of the ongoing call.
 * @param {string} audioUrl - The URL of the audio file to play.
 * @returns {Promise<void>} - Resolves when the update is successful.
 * @throws {Error} - Throws an error if the update fails.
 */
export async function playMessageInConference(conferenceSid: string, audioUrl: string): Promise<void> {
  try {
    await client.conferences(conferenceSid).update({
      announceUrl: audioUrl,
    });

    console.log(`Audio file ${audioUrl} is now playing in conference ${conferenceSid}.`);
  } catch (error: any) {
    console.error(`Failed to play message in conference ${conferenceSid}:`, error.message);
    throw new Error(`Error playing message in conference: ${error.message}`);
  }
}


/**
 * Plays an audio message in an ongoing call.
 *
 * @param {string} audioUrl - The URL of the audio file to play.
 * @returns {string} - Instructions for twiml on what to do
 * @throws {Error} - Throws an error if the update fails.
 */
export function handlePlayMessage(audioUrl: string): string {
  const twimlResponse = new VoiceResponse();
  
  twimlResponse.play(audioUrl);
  twimlResponse.gather({
    input: ['speech'],
    action: 'https://adapted-calm-crow.ngrok-free.app/gather-response',
    speechTimeout: 'end',
    timeout: 2,
  });
  return twimlResponse.toString();
}

/**
 * Adds a callee to the specified Twilio conference.
 *
 * @param calleeNumber - The phone number to dial and add to the conference.
 * @param conferenceName - The name of the conference to join.
 * @param callerId - The Twilio number used to make the call.
 * @returns The Call SID of the created call.
 */
export async function addCalleeToConference(
  calleeNumber: string,
  conferenceName: string,
  callerId: string
): Promise<string> {
  try {
    const call = await client.calls.create({
      to: calleeNumber,
      from: callerId,
      twiml: `
        <Response>
          <Dial>
            <Conference
              startConferenceOnEnter="true"
              endConferenceOnExit="true"
            >
              ${conferenceName}
            </Conference>
          </Dial>
        </Response>`,
      statusCallback: 'https://adapted-calm-crow.ngrok-free.app/call-status',
      statusCallbackEvent: ['initiated', 'ringing', 'in-progress', 'completed'],
    });

    console.log(`Callee added to conference. Call SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error('Error adding callee to conference:', error);
    throw error;
  }
}

/**
 * Adds a callee to the specified Twilio conference.
 *
 * @param calleeNumber - The phone number to dial and add to the conference.
 * @param conferenceName - The name of the conference to join.
 * @param callerId - The Twilio number used to make the call.
 * @returns The Call SID of the created call.
 */
export async function triggerGatherForCallee(
  calleeNumber: string,
  callerId: string
): Promise<string> {
  const twimlResponse = new VoiceResponse();
  
  twimlResponse.gather({
    input: ['speech'],
    action: 'https://adapted-calm-crow.ngrok-free.app/gather-response',
    speechTimeout: 'end',
    timeout: 2,
  });
  try {
    const call = await client.calls.create({
      to: calleeNumber,
      from: callerId,
      twiml: twimlResponse.toString()
    });

    console.log(`Callee added to conference. Call SID: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error('Error adding callee to conference:', error);
    throw error;
  }
}

export async function getConferenceInfo(conferenceName: string) {
  const conferences = await client.conferences.list({ status: 'in-progress' });
  const conference = conferences.find(
    (conf) => conf.friendlyName === conferenceName
  );

  return conference
}

/**
 * Updates an ongoing call to include a Gather prompt.
 *
 * @param gatherActionUrl - The URL where the Gather result will be sent.
 * @returns Promise<void>
 */
export async function addGatherToOngoingConference(
  conferenceName: string,
  gatherActionUrl: string
): Promise<void> {

  const conference = await getConferenceInfo(conferenceName);

  if (!conference) return;
  const participants = await getConferenceParticipants(conference?.sid)

  console.log(participants)
  try {
    // client
    //   .conferences(conference?.sid)
    //   .participants(participants[0].)
    //   .update({
    //     twiml: '<Response><Play>https://example.com/audio.mp3</Play></Response>',
    //   });

  } catch (error) {
    console.error('Error adding Gather to call:', error);
    throw error;
  }
}

/**
 * Get all participants in a Twilio conference.
 *
 * @param conferenceSid - The SID of the conference.
 * @returns Array of participants with their Call SIDs and statuses.
 */
export async function getConferenceParticipants(conferenceSid: string) {
  try {
    const participants = await client
      .conferences(conferenceSid)
      .participants.list();

    return participants.map((participant) => ({
      callSid: participant.callSid, // Unique ID of the participant's call
      muted: participant.muted,    // Whether the participant is muted
      hold: participant.hold,      // Whether the participant is on hold
      status: participant.status,  // Participant's call status
    }));
  } catch (error) {
    console.error('Error fetching conference participants:', error);
    throw error;
  }
}