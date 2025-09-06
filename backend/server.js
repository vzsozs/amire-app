// backend/server.js (GOLYÓÁLLÓ GET VERZIÓ)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const creds = require('./credentials.json');
const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SPREADSHEET_ID = '1Hcs7OHUPgAsFcBojNSTEh5bN6snZaYA6QBGuZJR-hwA';
const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

// --- SEGÉDFÜGGVÉNYEK ---
const JOB_HEADERS = ['id', 'title', 'status', 'deadline', 'description', 'assignedTeam', 'schedule', 'color', 'todoList'];
const TEAM_HEADERS = ['id', 'name', 'role', 'color', 'phone', 'email', 'availability'];

const rowToObject = (row, headers) => {
    const obj = {};
    const complexFields = ['assignedTeam', 'schedule', 'todoList', 'availability'];

    headers.forEach(header => {
        const value = row.get(header);
        if (complexFields.includes(header) && value) {
            try {
                obj[header] = JSON.parse(value);
            } catch (e) {
                obj[header] = value;
            }
        } else {
            obj[header] = value;
        }
    });
    return obj;
};

const buildRowData = (dataFromFrontend, headers) => {
    const rowData = {};
    headers.forEach(header => {
        const value = dataFromFrontend[header];
        if (value === undefined || value === null) {
            rowData[header] = ''; 
        } else if (typeof value === 'object') {
            rowData[header] = JSON.stringify(value);
        } else {
            rowData[header] = value;
        }
    });
    return rowData;
};

const handleError = (res, error, message) => {
    console.error(message, error);
    res.status(500).json({ message: `Szerverhiba: ${message}` });
};


// --- MUNKÁK (JOBS) ---

// --- API VÉGPONTOK ---

// JAVÍTOTT GET: Kiszűri az üres sorokat
app.get('/api/jobs', async (req, res) => {
    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['jobs'];
        if (!sheet) return res.status(404).json({ message: 'A "jobs" munkalap nem található.' });
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();
        // FONTOS: Csak azokat a sorokat dolgozzuk fel, amiknek van ID-ja (tehát nem üresek)
        const jobs = rows.filter(row => row.get('id')).map(row => rowToObject(row, sheet.headerValues));
        res.json(jobs);
    } catch (error) {
        handleError(res, error, "Hiba a munkák lekérésekor.");
    }
});

// JAVÍTOTT GET: Kiszűri az üres sorokat
app.get('/api/team', async (req, res) => {
    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['team'];
        if (!sheet) return res.status(404).json({ message: 'A "team" munkalap nem található.' });
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();
        const team = rows.filter(row => row.get('id')).map(row => rowToObject(row, sheet.headerValues));
        res.json(team);
    } catch (error) {
        handleError(res, error, "Hiba a csapat lekérésekor.");
    }
});

app.post('/api/jobs', async (req, res) => {
    console.log('\n--- ÚJ MUNKA HOZZÁADÁSA KÉRÉS BEÉRKEZETT ---');
    try {
        console.log('1. Frontendről érkezett body:', req.body);
        const newJobData = { id: Date.now().toString(), ...req.body };
        console.log('2. ID-vel kiegészített adat:', newJobData);

        const preparedData = buildRowData(newJobData, JOB_HEADERS);
        console.log('3. Google Sheet számára előkészített adat:', preparedData);
        
        console.log('4. Kapcsolódás a Google Doc-hoz...');
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['jobs'];
        console.log('5. "jobs" munkalap sikeresen betöltve.');
        
        console.log('6. Kísérlet az új sor hozzáadására...');
        const newRow = await sheet.addRow(preparedData);
        console.log('7. SOR HOZZÁADÁSA SIKERESNEK TŰNIK. Nincs hiba a `addRow` parancstól.');
        // A newRow objektumot is kiírhatjuk, hogy lássuk, mit ad vissza
        console.log('Visszakapott sor objektum:', newRow);
        
        console.log('8. Sikeres (201) válasz küldése a frontendnek.');
        res.status(201).json(newJobData); 
    } catch (error) {
        console.error('!!! HIBA A TRY BLOKKBAN !!!');
        handleError(res, error, "Hiba új munka hozzáadásakor.");
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const newJobData = { id: Date.now().toString(), ...req.body };
        const preparedData = buildRowData(newJobData, JOB_HEADERS);

        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['jobs'];
        if (!sheet) return res.status(404).json({ message: 'A "jobs" munkalap nem található.' });
        
        await sheet.addRow(preparedData);
        
        // --- JAVÍTÁS ITT ---
        // Az új, komplett adatot küldjük vissza, amit a frontend már ismer.
        res.status(201).json(newJobData); 
    } catch (error) {
        handleError(res, error, "Hiba új munka hozzáadásakor.");
    }
});

app.put('/api/jobs/:id', async (req, res) => {
    console.log('\n--- MUNKA FRISSÍTÉSE KÉRÉS BEÉRKEZETT ---');
    try {
        const jobId = req.params.id;
        console.log(`1. Keresendő Job ID a frontendről (URL-ből): "${jobId}" (típusa: ${typeof jobId})`);

        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['jobs'];
        if (!sheet) return res.status(404).json({ message: 'A "jobs" munkalap nem található.' });
        
        const rows = await sheet.getRows();
        console.log('2. A Google Táblázat összes sorának ID-ja (ellenőrzéshez):');
        rows.forEach(r => {
            const sheetId = r.get('id');
            console.log(`   - Sor ID a táblázatból: "${sheetId}" (típusa: ${typeof sheetId})`);
        });

        // --- A KRITIKUS RÉSZ JAVÍTÁSA ---
        // Biztosítjuk, hogy mindkét oldalon string legyen és levágjuk a felesleges szóközöket
        const rowToUpdate = rows.find(row => {
            const sheetId = row.get('id') || ''; // Ha üres a cella, üres string legyen
            return sheetId.trim() === jobId.trim();
        });

        if (!rowToUpdate) {
            console.error('!!! HIBA: A munka nem található a fenti listában. Az összehasonlítás sikertelen. !!!');
            return res.status(404).json({ message: 'Munka nem található.' });
        }
        
        console.log('3. Munka sikeresen megtalálva a táblázatban.');
        
        const updatedData = buildRowData(req.body, JOB_HEADERS);
        Object.keys(updatedData).forEach(key => {
            if (key !== 'id') {
                rowToUpdate.set(key, updatedData[key]);
            }
        });
        await rowToUpdate.save();
        console.log('4. Változtatások sikeresen elmentve a Google Táblázatba.');

        await sheet.loadHeaderRow();
        res.json(rowToObject(rowToUpdate, sheet.headerValues));
    } catch (error) {
        handleError(res, error, "Hiba munka frissítésekor.");
    }
});

// ÚJ, UNIVERZÁLIS PATCH VÉGPONT RÉSZLEGES FRISSÍTÉSEKHEZ
app.patch('/api/jobs/:id', async (req, res) => {
    console.log('\n--- MUNKA RÉSZLEGES FRISSÍTÉSE (PATCH) KÉRÉS BEÉRKEZETT ---');
    try {
        const jobId = req.params.id;
        const fieldsToUpdate = req.body; // A frontend csak a változott mezőket küldi, pl. { schedule: [...] }

        console.log(`1. Keresendő Job ID: "${jobId}"`);
        console.log('2. Frissítendő mezők:', fieldsToUpdate);

        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['jobs'];
        if (!sheet) return res.status(404).json({ message: 'A "jobs" munkalap nem található.' });
        
        const rows = await sheet.getRows();
        const rowToUpdate = rows.find(row => (row.get('id') || '').trim() === jobId.trim());

        if (!rowToUpdate) {
            console.error('!!! HIBA: A munka nem található. !!!');
            return res.status(404).json({ message: 'Munka nem található.' });
        }

        console.log('3. Munka sikeresen megtalálva.');

        // Végigmegyünk a frontend által küldött kulcsokon, és csak azokat a cellákat frissítjük
        Object.keys(fieldsToUpdate).forEach(key => {
            if (key !== 'id') { // Az ID-t sosem írjuk felül
                let value = fieldsToUpdate[key];
                // Ha a frissítendő érték objektum/tömb, stringgé alakítjuk
                if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                rowToUpdate.set(key, value);
            }
        });
        
        await rowToUpdate.save();
        console.log('4. Változtatások sikeresen elmentve.');

        await sheet.loadHeaderRow();
        res.json(rowToObject(rowToUpdate, sheet.headerValues));
    } catch (error) {
        handleError(res, error, "Hiba a munka részleges frissítésekor.");
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const jobId = req.params.id;
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['jobs'];
        if (!sheet) return res.status(404).json({ message: 'A "jobs" munkalap nem található.' });
        const rows = await sheet.getRows();
        const rowToDelete = rows.find(row => row.get('id') === jobId);
        if (!rowToDelete) return res.status(404).json({ message: 'Munka nem található.' });
        await rowToDelete.delete();
        res.status(204).send();
    } catch (error) {
        handleError(res, error, "Hiba munka törlésekor.");
    }
});

// --- CSAPAT (TEAM) ---

app.get('/api/team', async (req, res) => {
    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['team'];
        if (!sheet) return res.status(404).json({ message: 'A "team" munkalap nem található.' });
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();
        const team = rows.map(row => rowToObject(row, sheet.headerValues));
        res.json(team);
    } catch (error) {
        handleError(res, error, "Hiba a csapat lekérésekor.");
    }
});

app.post('/api/team', async (req, res) => {
    console.log('\n--- ÚJ CSAPATTAG HOZZÁADÁSA KÉRÉS BEÉRKEZETT ---');
    try {
        // A frontendről érkező adatokat kiegészítjük egyedi ID-val és előkészítjük
        const newMemberData = { id: Date.now().toString(), ...req.body };
        const preparedData = buildRowData(newMemberData, TEAM_HEADERS);

        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['team'];
        if (!sheet) return res.status(404).json({ message: 'A "team" munkalap nem található.' });
        
        await sheet.addRow(preparedData);
        
        // Visszaküldjük a teljes, ID-val ellátott új csapattagot a frontendnek
        res.status(201).json(newMemberData); 
    } catch (error) {
        handleError(res, error, "Hiba új csapattag hozzáadásakor.");
    }
});


app.put('/api/team/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['team'];
        if (!sheet) return res.status(404).json({ message: 'A "team" munkalap nem található.' });
        const rows = await sheet.getRows();
        const rowToUpdate = rows.find(row => row.get('id') === memberId);

        if (!rowToUpdate) return res.status(404).json({ message: 'Csapattag nem található.' });

        const updatedData = buildRowData(req.body, TEAM_HEADERS);
        Object.keys(updatedData).forEach(key => {
            if (key !== 'id') {
                rowToUpdate.set(key, updatedData[key]);
            }
        });
        await rowToUpdate.save();

        await sheet.loadHeaderRow();
        res.json(rowToObject(rowToUpdate, sheet.headerValues));
    } catch (error) {
        handleError(res, error, "Hiba csapattag frissítésekor.");
    }
});

// --- HIÁNYZÓ PATCH VÉGPONT HOZZÁADVA ---
app.patch('/api/team/:id', async (req, res) => {
    console.log('\n--- CSAPATTAG FRISSÍTÉSE (PATCH) KÉRÉS BEÉRKEZETT ---');
    try {
        const memberId = req.params.id;
        const fieldsToUpdate = req.body;

        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['team'];
        if (!sheet) return res.status(404).json({ message: 'A "team" munkalap nem található.' });
        
        const rows = await sheet.getRows();
        const rowToUpdate = rows.find(row => (row.get('id') || '').trim() === memberId.trim());

        if (!rowToUpdate) {
            return res.status(404).json({ message: 'Csapattag nem található.' });
        }
        
        Object.keys(fieldsToUpdate).forEach(key => {
            if (key !== 'id') {
                let value = fieldsToUpdate[key];
                if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                rowToUpdate.set(key, value);
            }
        });
        
        await rowToUpdate.save();
        
        await sheet.loadHeaderRow();
        res.json(rowToObject(rowToUpdate, sheet.headerValues));
    } catch (error) {
        handleError(res, error, "Hiba a csapattag frissítésekor.");
    }
});

// --- HIÁNYZÓ DELETE VÉGPONT HOZZÁADVA ---
app.delete('/api/team/:id', async (req, res) => {
    try {
        const memberId = req.params.id;
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['team'];
        if (!sheet) return res.status(404).json({ message: 'A "team" munkalap nem található.' });
        const rows = await sheet.getRows();
        const rowToDelete = rows.find(row => row.get('id') === memberId);
        if (!rowToDelete) return res.status(404).json({ message: 'Csapattag nem található.' });
        
        await rowToDelete.delete();
        res.status(204).send();
    } catch (error) {
        handleError(res, error, "Hiba csapattag törlésekor.");
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Adatbázis: Google Sheets');
});
