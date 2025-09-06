// api/backend/index.js (VÉGLEGES, TISZTA, KIZÁRÓLAG GOOGLEAPIS ALAPÚ KÓD)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();
// A Vercel a PORT-ot dinamikusan adja meg, de helyi fejlesztéshez maradhat a 3001
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- GOOGLE SHEETS HITELESÍTÉS ---
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

// --- SEGÉDFÜGGVÉNYEK ---
const rowsToObjects = (rows) => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const complexFields = ['assignedTeam', 'schedule', 'todoList', 'availability'];

  return dataRows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index] || '';
      if (complexFields.includes(header) && value) {
        try { value = JSON.parse(value); } catch (e) { /* marad string */ }
      }
      obj[header] = value;
    });
    return obj.id ? obj : null;
  }).filter(Boolean);
};


// --- DINAMIKUS API VÉGPONTOK ---
// A frontend a /api/jobs vagy /api/team útvonalat hívja, ezt a :sheetName paraméter kapja el.

app.get('/api/:sheetName', async (req, res) => {
    try {
        const { sheetName } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
        });
        const data = rowsToObjects(response.data.values);
        res.json(data);
    } catch (error) {
        console.error(`Hiba a(z) ${req.params.sheetName} adatok lekérésekor:`, error.message);
        res.status(500).json({ message: "Szerverhiba az adatok lekérésekor." });
    }
});

app.post('/api/:sheetName', async (req, res) => {
    try {
        const { sheetName } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${sheetName}!1:1` });
        const headers = headerResponse.data.values[0];
        const newData = { id: Date.now().toString(), ...req.body };
        const newRow = headers.map(header => {
            const value = newData[header];
            if (typeof value === 'object' && value !== null) return JSON.stringify(value);
            return value !== undefined ? value : '';
        });
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID, range: sheetName, valueInputOption: 'USER_ENTERED', resource: { values: [newRow] },
        });
        res.status(201).json(newData);
    } catch (error) {
        console.error(`Hiba új ${req.params.sheetName} hozzáadásakor:`, error.message);
        res.status(500).json({ message: "Szerverhiba az új elem hozzáadásakor." });
    }
});

app.patch('/api/:sheetName/:id', async (req, res) => {
    try {
        const { sheetName, id } = req.params;
        const fieldsToUpdate = req.body;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: sheetName });
        const rows = response.data.values;
        const headers = rows[0];
        const idColumnIndex = headers.indexOf('id');
        const rowIndex = rows.findIndex(row => row[idColumnIndex] === id);
        if (rowIndex === -1) return res.status(404).json({ message: "Az elem nem található." });
        const rowNumber = rowIndex + 1;
        const originalRow = rows[rowIndex];
        headers.forEach((header, index) => {
            if (fieldsToUpdate[header] !== undefined) {
                let value = fieldsToUpdate[header];
                if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
                originalRow[index] = value;
            }
        });
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A${rowNumber}:${String.fromCharCode(65 + headers.length - 1)}${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [originalRow] },
        });
        const updatedObject = rowsToObjects([headers, originalRow])[0];
        res.json(updatedObject);
    } catch (error) {
        console.error(`Hiba a(z) ${req.params.sheetName} frissítésekor:`, error.message);
        res.status(500).json({ message: "Szerverhiba az elem frissítésekor." });
    }
});

app.delete('/api/:sheetName/:id', async (req, res) => {
    try {
        const { sheetName, id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: sheetName });
        const rows = response.data.values;
        const idColumnIndex = rows[0].indexOf('id');
        const rowIndex = rows.findIndex(row => row[idColumnIndex] === id);
        if (rowIndex === -1) return res.status(404).json({ message: "Az elem nem található." });
        
        const sheetIdResponse = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheet = sheetIdResponse.data.sheets.find(s => s.properties.title === sheetName);
        const sheetId = sheet.properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{
                deleteDimension: {
                    range: { sheetId: sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }
                }
            }]}
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Hiba a(z) ${req.params.sheetName} törlésekor:`, error.message);
        res.status(500).json({ message: "Szerverhiba az elem törlésekor." });
    }
});

// A Vercel miatt a listen() hívás nem szükséges, de a helyi fejlesztéshez kell.
// A Vercel ezt a fájlt exportként kezeli, nem pedig futtatja.
// A biztonság kedvéért a Vercel környezetben nem hívjuk meg.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
        console.log('Adatbázis: Google Sheets (googleapis)');
    });
}

// A Vercel számára exportáljuk az app-ot
module.exports = app;