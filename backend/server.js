// Basic Express + SQLite backend for word learning app
import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

app.use(express.json());

// Database setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'words.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original TEXT NOT NULL,
    translation TEXT NOT NULL,
    date_added TEXT NOT NULL,
    guessed_right INTEGER DEFAULT 0,
    guessed_wrong INTEGER DEFAULT 0
  )`);
});

// Add a new word
app.post('/api/words', (req, res) => {
  const { original, translation } = req.body;
  if (!original || !translation) return res.status(400).json({ error: 'Missing fields' });
  const date_added = new Date().toISOString();
  db.run(
    'INSERT INTO words (original, translation, date_added) VALUES (?, ?, ?)',
    [original, translation, date_added],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, original, translation, date_added, guessed_right: 0, guessed_wrong: 0 });
    }
  );
});

// Bulk add words
app.post('/api/words/bulk', (req, res) => {
  const { words } = req.body;
  if (!Array.isArray(words) || words.length === 0) return res.status(400).json({ error: 'No words provided' });
  
  const date_added = new Date().toISOString();
  let insertedCount = 0;
  let completed = 0;
  
  words.forEach(({ original, translation }) => {
    if (original && translation) {
      db.run(
        'INSERT INTO words (original, translation, date_added) VALUES (?, ?, ?)',
        [original, translation, date_added],
        function (err) {
          completed++;
          if (!err) insertedCount++;
          
          if (completed === words.length) {
            res.json({ success: true, count: insertedCount });
          }
        }
      );
    } else {
      completed++;
      if (completed === words.length) {
        res.json({ success: true, count: insertedCount });
      }
    }
  });
});

// Get all words (alphabetical)
app.get('/api/words', (req, res) => {
  db.all('SELECT * FROM words ORDER BY original ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get quiz questions
app.get('/api/quiz', (req, res) => {
  const { type = 'original-to-translation', count = 6 } = req.query;
  db.all('SELECT * FROM words', [], (err, words) => {
    if (err) return res.status(500).json({ error: err.message });
    if (words.length < 3) return res.status(400).json({ error: 'Not enough words for quiz' });
    // Pick random questions
    const shuffled = words.sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, count).map(word => {
      // Pick wrong answers
      const wrongs = words.filter(w => w.id !== word.id);
      const wrongChoices = wrongs.sort(() => 0.5 - Math.random()).slice(0, 2);
      if (type === 'original-to-translation') {
        return {
          question: word.original,
          choices: [word.translation, ...wrongChoices.map(w => w.translation)].sort(() => 0.5 - Math.random()),
          answer: word.translation,
          id: word.id
        };
      } else {
        return {
          question: word.translation,
          choices: [word.original, ...wrongChoices.map(w => w.original)].sort(() => 0.5 - Math.random()),
          answer: word.original,
          id: word.id
        };
      }
    });
    res.json(questions);
  });
});

// Update word stats after quiz
app.post('/api/quiz-result', (req, res) => {
  const { results } = req.body; // [{id, correct: true/false}]
  if (!Array.isArray(results)) return res.status(400).json({ error: 'Invalid results' });
  const updatePromises = results.map(r => {
    return new Promise((resolve, reject) => {
      const field = r.correct ? 'guessed_right' : 'guessed_wrong';
      db.run(`UPDATE words SET ${field} = ${field} + 1 WHERE id = ?`, [r.id], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  Promise.all(updatePromises)
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Remove a word by id
app.delete('/api/words/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM words WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
