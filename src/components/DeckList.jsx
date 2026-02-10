import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useDecks } from '../hooks/useFirestore';
import { logout } from '../utils/auth';

export default function DeckList({ onSelectDeck, onImport, onSettings }) {
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
        <div className="text-dark/40 text-lg">Caricamento mazzi...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-light safe-area-top">
      {/* Top bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={handleLogout} className="text-dark/50 text-sm font-medium">
          Esci
        </button>
        <h1 className="text-lg font-bold text-dark flex items-center gap-1">
          🇩🇪 Mazzi
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
              <h2 className="text-xl font-bold text-dark mb-3">{deck.name}</h2>

              <div className="space-y-1.5 mb-4 text-base">
                <p className="text-dark/60">
                  📚 {deck.totalCards} carte
                </p>
                {stats.flashcardDue > 0 && (
                  <p className="text-dark/60">
                    🎴 {stats.flashcardDue} flashcard da rivedere
                  </p>
                )}
                {stats.translationDue > 0 && (
                  <p className="text-dark/60">
                    ✍️ {stats.translationDue} translation da rivedere
                  </p>
                )}
              </div>

              <button
                onClick={() => onSelectDeck(deck)}
                className="btn-primary w-full text-base"
              >
                Studia ora →
              </button>
            </div>
          );
        })}

        {decks.length === 0 && (
          <div className="text-center py-12 text-dark/40">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg mb-2">Nessun mazzo</p>
            <p className="text-sm">Importa il tuo primo mazzo per iniziare</p>
          </div>
        )}

        {/* Import button */}
        <button
          onClick={onImport}
          className="w-full border-2 border-dashed border-secondary/50 rounded-xl p-6
            text-secondary font-semibold text-base text-center
            active:bg-secondary/5 transition-colors"
        >
          + Importa nuovo mazzo
        </button>
      </div>
    </div>
  );
}
