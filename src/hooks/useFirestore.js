import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

export function useDecks() {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDecks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'decks'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Migrate decks missing sourceLang/targetLang (old format)
      const DEFAULT_SOURCE = { code: 'de', name: 'Deutsch', flag: '🇩🇪' };
      const DEFAULT_TARGET = { code: 'it', name: 'Italiano', flag: '🇮🇹' };
      for (const deck of data) {
        if (!deck.sourceLang || !deck.targetLang) {
          deck.sourceLang = DEFAULT_SOURCE;
          deck.targetLang = DEFAULT_TARGET;
          updateDoc(doc(db, 'decks', deck.id), {
            sourceLang: DEFAULT_SOURCE,
            targetLang: DEFAULT_TARGET,
          }).catch((err) => console.error('Deck migration error:', err));
        }
      }

      setDecks(data);
    } catch (err) {
      console.error('Error fetching decks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return { decks, loading, refetch: fetchDecks };
}

export function useDeckCards(deckId) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId) return;
    const fetchCards = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          collection(db, 'decks', deckId, 'cards')
        );
        const migrateBatch = writeBatch(db);
        let hasMigrations = false;

        const normalized = snapshot.docs.map((d) => {
          const data = d.data();
          const isOldFormat = !data.front && (data.german || data.italian);

          const card = {
            id: d.id,
            front: data.front || data.german || '',
            back: data.back || data.italian || '',
            exampleFront: data.exampleFront || data.exampleDE || '',
            exampleBack: data.exampleBack || data.exampleIT || '',
          };

          if (isOldFormat) {
            hasMigrations = true;
            migrateBatch.update(doc(db, 'decks', deckId, 'cards', d.id), {
              front: card.front,
              back: card.back,
              exampleFront: card.exampleFront,
              exampleBack: card.exampleBack,
            });
          }

          return card;
        });

        if (hasMigrations) {
          migrateBatch.commit().catch((err) =>
            console.error('Card migration error:', err)
          );
        }

        setCards(normalized);
      } catch (err) {
        console.error('Error fetching cards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [deckId]);

  return { cards, loading };
}

// Map old direction values to new ones
const DIRECTION_MIGRATION = {
  'de-it': 'source-target',
  'it-de': 'target-source',
};

export function useProgress(deckId, mode, direction) {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user || !deckId) return;
    setLoading(true);
    try {
      // Fetch with new direction
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', user.uid),
        where('deckId', '==', deckId),
        where('mode', '==', mode),
        where('direction', '==', direction)
      );
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // If empty, check for old-format direction and migrate
      if (results.length === 0) {
        const oldDirection = Object.entries(DIRECTION_MIGRATION)
          .find(([, v]) => v === direction)?.[0];

        if (oldDirection) {
          const oldQ = query(
            collection(db, 'progress'),
            where('userId', '==', user.uid),
            where('deckId', '==', deckId),
            where('mode', '==', mode),
            where('direction', '==', oldDirection)
          );
          const oldSnapshot = await getDocs(oldQ);

          if (oldSnapshot.docs.length > 0) {
            const batch = writeBatch(db);
            results = oldSnapshot.docs.map((d) => {
              const data = d.data();
              // Create new doc with new direction, delete old
              const newDocId = `${user.uid}_${deckId}_${data.cardId}_${mode}_${direction}`;
              batch.set(doc(db, 'progress', newDocId), {
                ...data,
                direction,
              });
              batch.delete(d.ref);
              return { id: newDocId, ...data, direction };
            });
            batch.commit().catch((err) =>
              console.error('Progress migration error:', err)
            );
          }
        }
      }

      setProgress(results);
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }, [user, deckId, mode, direction]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = useCallback(
    async (cardId, data) => {
      if (!user) return;
      const docId = `${user.uid}_${deckId}_${cardId}_${mode}_${direction}`;
      await setDoc(doc(db, 'progress', docId), {
        userId: user.uid,
        deckId,
        cardId,
        mode,
        direction,
        ...data,
      });
    },
    [user, deckId, mode, direction]
  );

  return { progress, loading, updateProgress, refetch: fetchProgress };
}

export async function addCard(deckId, cardData) {
  const cardRef = await addDoc(collection(db, 'decks', deckId, 'cards'), cardData);
  return cardRef.id;
}

export async function updateCard(deckId, cardId, cardData) {
  await updateDoc(doc(db, 'decks', deckId, 'cards', cardId), cardData);
}

export async function deleteCard(deckId, cardId) {
  await deleteDoc(doc(db, 'decks', deckId, 'cards', cardId));
}

export async function deleteDeck(deckId) {
  // Delete all cards first
  const cardsSnap = await getDocs(collection(db, 'decks', deckId, 'cards'));
  const batch = writeBatch(db);
  cardsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'decks', deckId));
  await batch.commit();
}

export async function importDeck(userId, name, description, cards, sourceLang, targetLang) {
  const deckRef = await addDoc(collection(db, 'decks'), {
    userId,
    name,
    description,
    sourceLang: sourceLang || { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    targetLang: targetLang || { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    totalCards: cards.length,
    createdAt: new Date().toISOString(),
  });

  const batch = writeBatch(db);
  cards.forEach((card) => {
    const cardRef = doc(collection(db, 'decks', deckRef.id, 'cards'));
    batch.set(cardRef, card);
  });
  await batch.commit();

  return deckRef.id;
}
