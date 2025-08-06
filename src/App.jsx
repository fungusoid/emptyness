import { useState, useEffect } from 'react'
import {
  Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Alert, Tabs, Tab, Box, Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import './App.css'

function App() {
  const [mode, setMode] = useState(0) // 0: Word List, 1: Quiz, 2: Bulk Add
  const [words, setWords] = useState([])
  const [original, setOriginal] = useState('')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizChecked, setQuizChecked] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [quizType, setQuizType] = useState('original-to-translation')
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState(null)

  // Fetch words from backend
  useEffect(() => {
    fetch('/api/words')
      .then(res => res.json())
      .then(setWords)
      .catch(() => setError('Failed to fetch words'))
  }, [])

  // Add new word
  const handleAddWord = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original, translation })
    })
    if (res.ok) {
      // Refetch all words after adding
      fetch('/api/words')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch words');
          return res.json();
        })
        .then(setWords)
        .catch(() => setError('Failed to fetch words'));
      setOriginal('');
      setTranslation('');
    } else {
      setError('Failed to add word');
    }
    setLoading(false)
  }

  // Remove word
  const handleRemoveWord = async (id) => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/words/${id}`, { method: 'DELETE' })
    if (res.ok) {
      // Refetch all words after deletion
      fetch('/api/words')
        .then(res => res.json())
        .then(setWords)
        .catch(() => setError('Failed to fetch words'))
    } else {
      setError('Failed to remove word')
    }
    setLoading(false)
  }

  // Quiz logic
  const startQuiz = async () => {
    setLoading(true)
    setQuizChecked(false)
    setQuizResult(null)
    setError('')
    const res = await fetch(`/api/quiz?type=${quizType}&count=6`)
    if (res.ok) {
      const questions = await res.json()
      setQuizQuestions(questions)
      setQuizAnswers({})
    } else {
      setError('Failed to fetch quiz')
      setQuizQuestions([])
    }
    setLoading(false)
  }

  const handleQuizAnswer = (qid, answer) => {
    setQuizAnswers(a => ({ ...a, [qid]: answer }))
  }

  const checkQuiz = async () => {
    setQuizChecked(true)
    // Prepare results for backend
    const results = quizQuestions.map(q => ({
      id: q.id,
      correct: quizAnswers[q.id] === q.answer
    }))
    const res = await fetch('/api/quiz-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results })
    })
    if (res.ok) {
      setQuizResult(results)
    } else {
      setError('Failed to submit quiz results')
    }
  }

  // Bulk add handler
  const handleBulkAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBulkResult(null)
    const lines = bulkText.split('\n').map(line => line.trim()).filter(Boolean)
    const words = lines.map(line => {
      const [original, translation] = line.split(':').map(s => s?.trim())
      return original && translation ? { original, translation } : null
    }).filter(Boolean)
    if (words.length === 0) {
      setError('No valid word pairs found.')
      setLoading(false)
      return
    }
    const res = await fetch('/api/words/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    })
    if (res.ok) {
      setBulkResult(`${words.length} words added!`)
      setBulkText('')
      // Refetch words
      fetch('/api/words').then(res => res.json()).then(setWords)
    } else {
      setError('Failed to add words')
    }
    setLoading(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Paper 
        elevation={2} 
        sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          borderRadius: 0,
          bgcolor: 'white'
        }}
      >
        <Container maxWidth="md">
          <Tabs 
            value={mode} 
            onChange={(_, v) => setMode(v)} 
            sx={{ py: 1 }} 
            centered
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Word List" />
            <Tab label="Quiz" />
            <Tab label="Bulk Add" />
          </Tabs>
        </Container>
      </Paper>
      <Container maxWidth="md" sx={{ py: 4 }}>
      {mode === 0 && (
        <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, mb: 3, boxShadow: 1, minWidth: 800 }}>
          <Typography variant="h4" gutterBottom color="primary">Word Learning App</Typography>
          <Box component="form" onSubmit={handleAddWord} sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Original word"
              value={original}
              onChange={e => setOriginal(e.target.value)}
              required
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Translation"
              value={translation}
              onChange={e => setTranslation(e.target.value)}
              required
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Add Word
            </Button>
            {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">All Words (Alphabetical)</Typography>
            <Typography variant="body2" color="text.secondary">
              {words.length} word{words.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Original</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Translation</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date Added</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Right</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Wrong</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {words.map(w => (
                  <TableRow key={w.id} hover>
                    <TableCell>{w.original}</TableCell>
                    <TableCell>{w.translation}</TableCell>
                    <TableCell>{w.date_added?.slice(0,10)}</TableCell>
                    <TableCell>{w.guessed_right}</TableCell>
                    <TableCell>{w.guessed_wrong}</TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => handleRemoveWord(w.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {mode === 1 && (
        <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, mb: 3, boxShadow: 1, minWidth: 800 }}>
          <Typography variant="h4" gutterBottom color="primary">Quiz Mode</Typography>
          <Box sx={{ mb: 3 }}>
            <Button
              variant={quizType === 'original-to-translation' ? 'contained' : 'outlined'}
              onClick={() => setQuizType('original-to-translation')}
              sx={{ mr: 1 }}
            >
              Original → Translation
            </Button>
            <Button
              variant={quizType === 'translation-to-original' ? 'contained' : 'outlined'}
              onClick={() => setQuizType('translation-to-original')}
            >
              Translation → Original
            </Button>
          </Box>
          <Box sx={{ minHeight: 200 }}>
            <Button variant="contained" color="primary" onClick={startQuiz} disabled={loading} sx={{ mb: 2 }}>
              Start Quiz
            </Button>
            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {quizQuestions.length > 0 && (
              <form>
                {quizQuestions.map((q, idx) => (
                  <Paper key={q.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{idx + 1}. {q.question}</Typography>
                    <RadioGroup
                      value={quizAnswers[q.id] || ''}
                      onChange={e => handleQuizAnswer(q.id, e.target.value)}
                    >
                      {q.choices.map((choice, i) => (
                        <FormControlLabel
                          key={i}
                          value={choice}
                          control={<Radio />}
                          label={choice}
                          disabled={quizChecked}
                          sx={{ 
                            color: quizChecked && choice === q.answer ? 'success.main' : 'inherit',
                            fontWeight: quizChecked && choice === q.answer ? 'bold' : 'normal'
                          }}
                        />
                      ))}
                    </RadioGroup>
                    {quizChecked && (
                      <Typography 
                        color={quizAnswers[q.id] === q.answer ? 'success.main' : 'error.main'}
                        sx={{ mt: 1, fontWeight: 'bold' }}
                      >
                        {quizAnswers[q.id] === q.answer ? 'Correct!' : `Wrong! Correct answer: ${q.answer}`}
                      </Typography>
                    )}
                  </Paper>
                ))}
                {!quizChecked && (
                  <Button variant="contained" color="secondary" onClick={checkQuiz} sx={{ mt: 2 }}>
                    Check Answers
                  </Button>
                )}
                {quizChecked && quizResult && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    You got {quizResult.filter(r => r.correct).length} / {quizResult.length} correct!
                  </Alert>
                )}
              </form>
            )}
          </Box>
        </Box>
      )}
      {mode === 2 && (
        <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, mb: 3, boxShadow: 1, minWidth: 800 }}>
          <Typography variant="h4" gutterBottom color="primary">Bulk Add Words</Typography>
          <Box component="form" onSubmit={handleBulkAdd}>
            <TextField
              label="Paste words here (one per line: original:translation)"
              multiline
              minRows={8}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              placeholder="Example:&#10;hello:hola&#10;goodbye:adiós&#10;thank you:gracias"
            />
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Add Words
            </Button>
            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Box>
          {bulkResult && <Alert severity="success" sx={{ mt: 2 }}>{bulkResult}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
      )}
      </Container>
    </Box>
  )
}

export default App
