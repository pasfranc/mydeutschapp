import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useDecks } from '../hooks/useFirestore';
import { logout } from '../utils/auth';

export default function DeckList({ onSelectDeck, onImport, onEditDeck, onStats }) {
  const { user } = useAuth();
  const { decks, loading, refetch } = useDecks();
  const [deckStats, setDeckStats] = useState({});

  useEffect(() => {
    if (!user || decks.length === 0) return;

    const fetchStats = async () => {
      const stats = {};
      for (const deck of decks) {
        try {
          const now = new Date().toISOString();
          // Fetch flashcard progress
          const fcQuery = query(
            collection(db, 'progress'),
            where('userId', '==', user.uid),
            where('deckId', '==', deck.id),
            where('mode', '==', 'flashcard')
          );
          const fcSnap = await getDocs(fcQuery);
          const fcDue = fcSnap.docs.filter(
            (d) => d.data().nextReview <= now
          ).length;
          const fcNew = deck.totalCards - fcSnap.docs.length;

          // Fetch translation progress
          const trQuery = query(
            collection(db, 'progress'),
            where('userId', '==', user.uid),
            where('deckId', '==', deck.id),
            where('mode', '==', 'translation')
          );
          const trSnap = await getDocs(trQuery);
          const trDue = trSnap.docs.filter(
            (d) => d.data().nextReview <= now
          ).length;
          const trNew = deck.totalCards - trSnap.docs.length;

          stats[deck.id] = {
            flashcardDue: fcDue + fcNew,
            translationDue: trDue + trNew,
            hasProgress: fcSnap.docs.length > 0 || trSnap.docs.length > 0,
          };
        } catch (err) {
          console.error('Error fetching stats:', err);
          stats[deck.id] = { flashcardDue: deck.totalCards, translationDue: deck.totalCards };
        }
      }
      setDeckStats(stats);
    };

    fetchStats();
  }, [user, decks]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-light flex items-center justify-center">
        <div className="text-dark/40 text-lg">Loading decks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-light safe-area-top">
      {/* Top bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={handleLogout} className="text-dark/50 text-sm font-medium">
          Logout
        </button>
        <h1 className="text-lg font-bold text-dark flex items-center gap-1">
          🇩🇪 Decks
        </h1>
        <div className="w-10" />
      </div>

      {/* Deck list */}
      <div className="p-4 space-y-4 pb-8">
        {decks.map((deck) => {
          const stats = deckStats[deck.id] || {};
          return (
            <div
              key={deck.id}
              className="card"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-dark">{deck.name}</h2>
                <button
                  onClick={() => onEditDeck(deck)}
                  className="text-dark/30 hover:text-dark/60 text-sm font-medium px-2 py-1 active:scale-95 transition-all"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-1.5 mb-4 text-base">
                <p className="text-dark/60">
                  📚 {deck.totalCards} cards
                </p>
                {stats.flashcardDue > 0 && (
                  <p className="text-dark/60">
                    🎴 {stats.flashcardDue} flashcards to review
                  </p>
                )}
                {stats.translationDue > 0 && (
                  <p className="text-dark/60">
                    ✍️ {stats.translationDue} translations to review
                  </p>
                )}
              </div>

              {stats.hasProgress && (
                <button
                  onClick={() => onStats(deck)}
                  className="w-full text-secondary font-semibold text-base py-2 mb-2 active:scale-95 transition-transform"
                >
                  Stats
                </button>
              )}

              <button
                onClick={() => onSelectDeck(deck)}
                className="btn-primary w-full text-base"
              >
                Study now →
              </button>
            </div>
          );
        })}

        {decks.length === 0 && (
          <div className="text-center py-12 text-dark/40">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg mb-2">No decks yet</p>
            <p className="text-sm">Import your first deck to get started</p>
          </div>
        )}

        {/* Import button */}
        <button
          onClick={onImport}
          className="w-full border-2 border-dashed border-secondary/50 rounded-xl p-6
            text-secondary font-semibold text-base text-center
            active:bg-secondary/5 transition-colors"
        >
          + Import new deck
        </button>
      </div>
    </div>
  );
}
