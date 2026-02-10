import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import DeckList from './components/DeckList';
import DeckImport from './components/DeckImport';
import StudyOptions from './components/StudyOptions';
import FlashcardMode from './components/FlashcardMode';
import TranslationMode from './components/TranslationMode';
import CompleteScreen from './components/CompleteScreen';
import { useDeckCards, useProgress } from './hooks/useFirestore';
import { getCardsToReview, DEFAULT_PROGRESS } from './utils/srs';

/**
 * App screens:
 * - decks: deck list (home)
 * - import: import new deck
 * - options: study options for a deck
 * - study: flashcard or translation mode
 * - complete: session complete
 */

function StudySession({ deck, mode, direction, sessionSize, onComplete, onBack }) {
  const { cards, loading: cardsLoading } = useDeckCards(deck.id);
  const {
    progress,
    loading: progressLoading,
    updateProgress,
  } = useProgress(deck.id, mode, direction);

  const [studyCards, setStudyCards] = useState(null);
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    if (cardsLoading || progressLoading) return;

    // Build progress map
    const pMap = {};
    progress.forEach((p) => {
      pMap[p.cardId] = p;
    });
    setProgressMap(pMap);

    // Determine which cards to study
    const now = new Date();
    let toStudy = cards.filter((card) => {
      const p = pMap[card.id];
      if (!p) return true;
      return new Date(p.nextReview) <= now;
    });

    // If no cards due, use all cards
    if (toStudy.length === 0) toStudy = [...cards];

    // Build session of exact sessionSize, repeating cards if needed
    const session = [];
    for (let i = 0; i < sessionSize; i++) {
      session.push(toStudy[i % toStudy.length]);
    }
    setStudyCards(session);
  }, [cards, progress, cardsLoading, progressLoading, sessionSize]);

  const handleUpdateProgress = useCallback(
    (cardId, data) => {
      setProgressMap((prev) => ({ ...prev, [cardId]: data }));
      updateProgress(cardId, data);
    },
    [updateProgress]
  );

  if (cardsLoading || progressLoading || !studyCards) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-dark/40 text-lg">Preparing cards...</div>
      </div>
    );
  }

  if (studyCards.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-dark mb-2">All done!</h2>
        <p className="text-dark/50 text-center mb-6">
          No cards to review right now. Come back later!
        </p>
        <button onClick={onBack} className="btn-primary">
          Back to decks
        </button>
      </div>
    );
  }

  if (mode === 'flashcard') {
    return (
      <FlashcardMode
        cards={studyCards}
        direction={direction}
        progressMap={progressMap}
        onUpdateProgress={handleUpdateProgress}
        onComplete={onComplete}
      />
    );
  }

  return (
    <TranslationMode
      cards={studyCards}
      direction={direction}
      progressMap={progressMap}
      onUpdateProgress={handleUpdateProgress}
      onComplete={onComplete}
    />
  );
}

function AppContent() {
  const [screen, setScreen] = useState('decks');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [studyMode, setStudyMode] = useState(null);
  const [studyDirection, setStudyDirection] = useState(null);
  const [studySize, setStudySize] = useState(20);
  const [completionStats, setCompletionStats] = useState(null);

  const handleSelectDeck = useCallback((deck) => {
    setSelectedDeck(deck);
    setScreen('options');
  }, []);

  const handleStartStudy = useCallback((mode, direction, sessionSize) => {
    setStudyMode(mode);
    setStudyDirection(direction);
    setStudySize(sessionSize);
    setScreen('study');
  }, []);

  const handleComplete = useCallback((stats) => {
    setCompletionStats(stats);
    setScreen('complete');
  }, []);

  const handleBackToDecks = useCallback(() => {
    setScreen('decks');
    setSelectedDeck(null);
    setStudyMode(null);
    setStudyDirection(null);
    setStudySize(20);
    setCompletionStats(null);
  }, []);

  const handleStudyAgain = useCallback(() => {
    setScreen('study');
    setCompletionStats(null);
  }, []);

  switch (screen) {
    case 'decks':
      return (
        <DeckList
          onSelectDeck={handleSelectDeck}
          onImport={() => setScreen('import')}
        />
      );

    case 'import':
      return (
        <DeckImport
          onBack={handleBackToDecks}
          onImported={() => {
            setScreen('decks');
          }}
        />
      );

    case 'options':
      return (
        <StudyOptions
          deck={selectedDeck}
          onStart={handleStartStudy}
          onBack={handleBackToDecks}
        />
      );

    case 'study':
      return (
        <StudySession
          deck={selectedDeck}
          mode={studyMode}
          direction={studyDirection}
          sessionSize={studySize}
          onComplete={handleComplete}
          onBack={handleBackToDecks}
        />
      );

    case 'complete':
      return (
        <CompleteScreen
          stats={completionStats}
          onStudyAgain={handleStudyAgain}
          onBackToDecks={handleBackToDecks}
        />
      );

    default:
      return null;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}
