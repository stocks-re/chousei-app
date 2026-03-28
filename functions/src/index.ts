import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

/**
 * Write a finalized event to Google Calendar.
 * Called from the client after the creator authenticates.
 */
export const calendarWrite = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const { accessToken, eventTitle, date, startTime, endTime, description } = req.body;

  if (!accessToken || !eventTitle || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const eventBody: Record<string, unknown> = {
      summary: eventTitle,
      description: description || '',
    };

    if (startTime && endTime) {
      eventBody.start = { dateTime: `${date}T${startTime}:00`, timeZone: 'Asia/Tokyo' };
      eventBody.end = { dateTime: `${date}T${endTime}:00`, timeZone: 'Asia/Tokyo' };
    } else {
      eventBody.start = { date };
      eventBody.end = { date };
    }

    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody as Parameters<typeof calendar.events.insert>[0] extends { requestBody?: infer R } ? R : never,
    });

    res.json({
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
    });
  } catch (err) {
    console.error('Calendar write error:', err);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});
