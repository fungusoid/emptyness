import { useState, useEffect } from 'react'
import {
  Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Alert, Tabs, Tab, Box, Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import './App.css'

function App() {
  const [mode, setMode] = useState(0) // 0: Word List, 1: Quiz
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
        .then(res => res.json())
        .then(setWords)
        .catch(() => setError('Failed to fetch words'))
      setOriginal('')
      setTranslation('')
    } else {
      setError('Failed to add word')
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

  return (
    <Container maxWidth="md" sx={{ mt: 0, px: 0 }}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0, m: 0 }}>
        <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ mt: 0, mb: 4, width: '100%', maxWidth: 500, p: 0, m: 0 }} centered>
          <Tab label="Word List" />
          <Tab label="Quiz" />
        </Tabs>
      </Box>
      {mode === 0 && (
        <Box sx={{ width: '100%', mt: 0 }}>
          <Box sx={{ height: 32 }} />
          <Typography variant="h3" gutterBottom>Word Learning App</Typography>
          <form onSubmit={handleAddWord} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <TextField
              label="Original word"
              value={original}
              onChange={e => setOriginal(e.target.value)}
              required
            />
            <TextField
              label="Translation"
              value={translation}
              onChange={e => setTranslation(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Add Word
            </Button>
            {loading && <CircularProgress size={24} />}
          </form>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="h5" gutterBottom>All Words (Alphabetical)</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Original</TableCell>
                  <TableCell>Translation</TableCell>
                  <TableCell>Date Added</TableCell>
                  <TableCell>Right</TableCell>
                  <TableCell>Wrong</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {words.map(w => (
                  <TableRow key={w.id}>
                    <TableCell>{w.original}</TableCell>
                    <TableCell>{w.translation}</TableCell>
                    <TableCell>{w.date_added?.slice(0,10)}</TableCell>
                    <TableCell>{w.guessed_right}</TableCell>
                    <TableCell>{w.guessed_wrong}</TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => handleRemoveWord(w.id)}>
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
        <Box sx={{ width: '100%', mt: 0 }}>
          <Box sx={{ height: 32 }} />
          <Typography variant="h4" gutterBottom>Quiz Mode</Typography>
          <Box sx={{ mb: 2 }}>
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
          <Box sx={{ minHeight: 400, width: '100%' }}>
            <Button variant="contained" color="primary" onClick={startQuiz} disabled={loading} sx={{ mb: 2 }}>
              Start Quiz
            </Button>
            {loading && <CircularProgress size={24} />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {quizQuestions.length > 0 && (
              <form>
                {quizQuestions.map((q, idx) => (
                  <Box key={q.id} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                    <Typography variant="h6">{idx + 1}. {q.question}</Typography>
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
                          sx={{ color: quizChecked && choice === q.answer ? 'green' : undefined }}
                        />
                      ))}
                    </RadioGroup>
                    {quizChecked && (
                      <Typography color={quizAnswers[q.id] === q.answer ? 'green' : 'red'}>
                        {quizAnswers[q.id] === q.answer ? 'Correct!' : `Wrong! Correct answer: ${q.answer}`}
                      </Typography>
                    )}
                  </Box>
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
    </Container>
  )
}

export default App
