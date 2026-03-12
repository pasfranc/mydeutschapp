import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

export default function DeckStats({ deck, onBack, onPracticeHardest }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [allProgress, setAllProgress] = useState([]);

  useEffect(() => {
    if (!user || !deck) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cardsSnap, progressSnap] = await Promise.all([
          getDocs(collection(db, 'decks', deck.id, 'cards')),
          getDocs(
            query(
              collection(db, 'progress'),
              where('userId', '==', user.uid),
              where('deckId', '==', deck.id)
            )
          ),
        ]);
        setCards(cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllProgress(progressSnap.docs.map((d) => d.data()));
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, deck]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-light flex items-center justify-center">
        <div className="text-dark/40 text-lg">Loading stats...</div>
      </div>
    );
  }

  // Group progress by mode+direction
  const groups = {};
  allProgress.forEach((p) => {
    const key = `${p.mode}_${p.direction}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  // Overall stats: best progress per card (highest easeFactor across all modes)
  const bestByCard = {};
  allProgress.forEach((p) => {
    if (!bestByCard[p.cardId] || p.easeFactor < bestByCard[p.cardId].easeFactor) {
      bestByCard[p.cardId] = p;
    }
  });

  const totalCards = cards.length;
  const cardsWithProgress = Object.keys(bestByCard).length;
  const cardsMastered = Object.values(bestByCard).filter((p) => p.interval >= 21).length;
  const cardsLearning = cardsWithProgress - cardsMastered;
  const cardsNew = totalCards - cardsWithProgress;

  // Mastery: avg easeFactor normalized (1.3=0%, 2.5=100%)
  const avgEF = cardsWithProgress > 0
    ? Object.values(bestByCard).reduce((s, p) => s + p.easeFactor, 0) / cardsWithProgress
    : 0;
  const mastery = cardsWithProgress > 0
    ? Math.round(Math.min(100, Math.max(0, ((avgEF - 1.3) / (2.5 - 1.3)) * 100)))
    : 0;

  // Unique study days
  const studyDays = new Set(allProgress.map((p) => p.lastReviewed?.slice(0, 10)).filter(Boolean));

  // Hardest words: cards with lowest easeFactor (only cards with progress)
  const hardest = Object.entries(bestByCard)
    .sort((a, b) => a[1].easeFactor - b[1].easeFactor)
    .slice(0, 8)
    .map(([cardId, prog]) => {
      const card = cards.find((c) => c.id === cardId);
      return card ? { ...card, easeFactor: prog.easeFactor, interval: prog.interval } : null;
    })
    .filter(Boolean);

  const hardestCardIds = hardest.map((c) => c.id);

  // Mode labels
  const modeLabels = {
    'flashcard_de-it': { icon: '🎴', label: 'Flashcard DE → IT' },
    'flashcard_it-de': { icon: '🎴', label: 'Flashcard IT → DE' },
    'translation_de-it': { icon: '✍️', label: 'Translation DE → IT' },
    'translation_it-de': { icon: '✍️', label: 'Translation IT → DE' },
  };

  return (
    <div className="min-h-dvh bg-light safe-area-top flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center border-b border-gray-100">
        <button onClick={onBack} className="text-primary font-medium text-base">
          ←
        </button>
        <h1 className="text-lg font-bold text-dark ml-4 flex-1 truncate">
          Stats: {deck.name}
        </h1>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto pb-8">
        {/* Mastery overview */}
        <div className="card">
          <h2 className="text-lg font-bold text-dark mb-3">Overview</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="#4ECDC4" strokeWidth="3"
                  strokeDasharray={`${mastery * 0.975} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-dark">{mastery}%</span>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-dark/60">{studyDays.size} days studied</p>
              <p className="text-dark/60">{allProgress.length} total reviews</p>
            </div>
          </div>

          {/* Card breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-success/10 rounded-lg py-2">
              <p className="text-lg font-bold text-success">{cardsMastered}</p>
              <p className="text-xs text-dark/50">Mastered</p>
            </div>
            <div className="bg-warning/10 rounded-lg py-2">
              <p className="text-lg font-bold text-warning">{cardsLearning}</p>
              <p className="text-xs text-dark/50">Learning</p>
            </div>
            <div className="bg-gray-100 rounded-lg py-2">
              <p className="text-lg font-bold text-dark/40">{cardsNew}</p>
              <p className="text-xs text-dark/50">New</p>
            </div>
          </div>
        </div>

        {/* Mode breakdown */}
        {Object.keys(groups).length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-dark mb-3">By mode</h2>
            <div className="space-y-3">
              {Object.entries(groups).map(([key, progList]) => {
                const info = modeLabels[key] || { icon: '📊', label: key };
                const groupCards = new Set(progList.map((p) => p.cardId));
                const groupMastered = progList.filter((p) => p.interval >= 21).length;
                const groupAvgEF = progList.reduce((s, p) => s + p.easeFactor, 0) / progList.length;
                const groupMastery = Math.round(Math.min(100, Math.max(0, ((groupAvgEF - 1.3) / (2.5 - 1.3)) * 100)));
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xl">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark">{info.label}</p>
                      <p className="text-xs text-dark/50">
                        {groupCards.size} cards studied · {groupMastered} mastered
                      </p>
                    </div>
                    <span className="text-sm font-bold text-secondary">{groupMastery}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hardest words */}
        {hardest.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-dark mb-3">Hardest words</h2>
            <div className="space-y-2">
              {hardest.map((card) => {
                const difficulty = Math.round(Math.max(0, ((card.easeFactor - 1.3) / (2.5 - 1.3)) * 100));
                return (
                  <div key={card.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-error">{difficulty}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark truncate">{card.german}</p>
                      <p className="text-xs text-dark/50 truncate">{card.italian}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => onPracticeHardest(hardestCardIds)}
              className="btn-primary w-full text-sm mt-4"
            >
              Practice these →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
