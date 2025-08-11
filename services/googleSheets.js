import { google } from 'googleapis';
import { logger } from '../utils/logger.js';
import fs from 'node:fs';

let sheetsClient;

function getCredentials() {
  const path = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (path && fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
  if (json) {
    try { return JSON.parse(json); } catch (e) {
      logger.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON');
      throw e;
    }
  }
  throw new Error('Google service account credentials not provided. Set GOOGLE_SERVICE_ACCOUNT_PATH or GOOGLE_SERVICE_ACCOUNT_JSON');
}

function ensureClient() {
  if (sheetsClient) return sheetsClient;
  const creds = getCredentials();
  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  sheetsClient = google.sheets({ version: 'v4', auth: jwt });
  return sheetsClient;
}

export async function appendJournalRow(row) {
  const sheets = ensureClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID not set');

  const values = [[
    new Date().toISOString(),
    row.date || new Date().toISOString().slice(0,10),
    row.chat_id,
    row.section,
    row.q1 ?? '',
    row.q2 ?? '',
    row.q3 ?? '',
    row.mood ?? '',
    row.energy ?? '',
    row.notes ?? ''
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Journal!A:J',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values }
  });
  logger.info('Appended row to Sheets', row.section);
}