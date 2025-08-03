# Word Learning App

A simple, modular, and extensible language learning app built with React, Node.js, and SQLite.

## Features

- **Word List:** Add, view, and delete words with their translations. Words are shown in alphabetical order.
- **Quiz Modes:** 
  - Original → Translation: Multiple choice quiz from original word to translation.
  - Translation → Original: Multiple choice quiz from translation to original word.
- **Material Design:** Clean, modern UI using Material UI (MUI).
- **Statistics:** Tracks how many times each word was guessed right or wrong.
- **Consistent Navigation:** Menu tabs for switching between Word List and Quiz modes, always aligned at the top.
- **Backend:** Node.js server with SQLite database for persistent word and quiz data.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Running the App

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend (in a separate terminal):**
   ```bash
   npm run dev
   ```

3. **Open your browser:**  
   Visit [http://localhost:5173](http://localhost:5173)

### Project Structure

```
emptyness/
├── backend/           # Node.js + SQLite backend
├── src/               # React frontend source code
├── public/            # Static assets
├── package.json       # Frontend dependencies
├── vite.config.js     # Vite config with proxy for API
└── README.md
```

## Customization

- All code is modular and easy to extend.
- See `.github/copilot-instructions.md` for workspace-specific coding guidelines.

## License

This project is private.  
For personal use only.
