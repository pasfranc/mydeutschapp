# myDeutschApp

A Progressive Web App for learning German vocabulary (German-Italian) with flashcards and spaced repetition.

**Live:** [mydeutschapp.web.app](https://mydeutschapp.web.app)

## Features

- **Flashcard mode** — tap to flip, swipe to rate (Again / Good / Easy)
- **Translation mode** — write the translation, get similarity-based feedback
- **Bidirectional study** — German to Italian or Italian to German
- **Spaced repetition** — SM-2 algorithm schedules reviews at optimal intervals
- **Customizable sessions** — choose 20, 40, 60, or custom number of cards
- **Deck import** — load vocabulary from JSON files
- **PWA** — installable, works offline with Service Worker
- **Mobile-first** — swipe gestures, haptic feedback, safe area support

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Firebase (Authentication, Firestore, Hosting)
- **Auth:** Email magic links (passwordless)

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication (Email link) and Firestore enabled

### Setup

```bash
git clone https://github.com/pasfranc/mydeutschapp.git
cd mydeutschapp
npm install
```

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_APP_URL=https://your-app-url.web.app
```

### Development

```bash
npm run dev
```

### Build & Deploy

```bash
npm run build                          # build only
npm run redeploy                       # build + deploy to Firebase Hosting
firebase deploy --only firestore:rules # deploy Firestore security rules
```

## Deck Format

Import decks as JSON files with this structure:

```json
{
  "name": "My Deck",
  "description": "Optional description",
  "cards": [
    {
      "german": "der Hund",
      "italian": "il cane",
      "exampleDE": "Der Hund spielt im Garten.",
      "exampleIT": "Il cane gioca in giardino."
    }
  ]
}
```

## Project Structure

```
src/
├── components/       # React screen components
│   ├── auth/         # Login, email sent, auth guard
│   ├── DeckList      # Home — deck listing with review counts
│   ├── DeckImport    # JSON deck importer
│   ├── StudyOptions  # Mode, direction, session size selection
│   ├── FlashcardMode # Flashcard study with swipe gestures
│   ├── TranslationMode # Translation study with validation
│   └── CompleteScreen  # Session stats with confetti
├── context/          # AuthContext (Firebase auth state)
├── hooks/            # useFirestore (Firestore CRUD), useSwipe
├── utils/            # Firebase config, auth, SRS algorithm, validation
└── styles/           # Tailwind + custom CSS
```

## License

MIT
