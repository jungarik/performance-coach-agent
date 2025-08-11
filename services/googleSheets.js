import { google } from 'googleapis';

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing');
  const sa = JSON.parse(raw);

  // Handle both multiline keys and \n-escaped keys
  if (typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.includes('\\n')
      ? sa.private_key.replace(/\\n/g, '\n')
      : sa.private_key;
  }
  return sa;
}

export function getSheetsClient() {
  const sa = getServiceAccount();
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Example: append a row
export async function appendJournalRow({ chat_id, section, q1 = '', q2 = '', q3 = '' }) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const range = 'Journal!A:Z'; // adjust to your sheet/tab
  const values = [[new Date().toISOString(), String(chat_id), section, q1, q2, q3]];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}