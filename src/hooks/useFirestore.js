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
        setCards(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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

export function useProgress(deckId, mode, direction) {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user || !deckId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'progress'),
        where('userId', '==', user.uid),
        where('deckId', '==', deckId),
        where('mode', '==', mode),
        where('direction', '==', direction)
      );
      const snapshot = await getDocs(q);
      setProgress(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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

export async function updateCard(deckId, cardId, data) {
  await updateDoc(doc(db, 'decks', deckId, 'cards', cardId), data);
}

export async function deleteCard(deckId, cardId) {
  await deleteDoc(doc(db, 'decks', deckId, 'cards', cardId));
  // Update totalCards count
  const snapshot = await getDocs(collection(db, 'decks', deckId, 'cards'));
  await updateDoc(doc(db, 'decks', deckId), { totalCards: snapshot.size });
}

export async function deleteDeck(deckId) {
  // Delete all cards
  const cardsSnap = await getDocs(collection(db, 'decks', deckId, 'cards'));
  const batch = writeBatch(db);
  cardsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'decks', deckId));
  await batch.commit();

  // Delete all progress for this deck
  const progressSnap = await getDocs(
    query(collection(db, 'progress'), where('deckId', '==', deckId))
  );
  if (progressSnap.size > 0) {
    const pBatch = writeBatch(db);
    progressSnap.docs.forEach((d) => pBatch.delete(d.ref));
    await pBatch.commit();
  }
}

export async function importDeck(userId, name, description, cards) {
  const deckRef = await addDoc(collection(db, 'decks'), {
    userId,
    name,
    description,
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
