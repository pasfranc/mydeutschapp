import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { addCard, updateCard, deleteCard, deleteDeck } from '../hooks/useFirestore';

const DEFAULT_SOURCE = { code: 'de', name: 'Deutsch', flag: '🇩🇪' };
const DEFAULT_TARGET = { code: 'it', name: 'Italiano', flag: '🇮🇹' };

export default function DeckDetail({ deck, onBack, onDeckDeleted }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ front: '', back: '', exampleFront: '', exampleBack: '' });
  const [showDeleteDeck, setShowDeleteDeck] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState(false);

  const sourceLang = deck.sourceLang || DEFAULT_SOURCE;
  const targetLang = deck.targetLang || DEFAULT_TARGET;

  useEffect(() => {
    if (!deck) return;
    const fetchCards = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          collection(db, 'decks', deck.id, 'cards')
        );
        setCards(snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            front: data.front || data.german || '',
            back: data.back || data.italian || '',
            exampleFront: data.exampleFront || data.exampleDE || '',
            exampleBack: data.exampleBack || data.exampleIT || '',
          };
        }));
      } catch (err) {
        console.error('Error fetching cards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [deck]);

  const handleEdit = (card) => {
    setEditingId(card.id);
    setEditForm({
      front: card.front || '',
      back: card.back || '',
      exampleFront: card.exampleFront || '',
      exampleBack: card.exampleBack || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (cardId) => {
    setSaving(true);
    try {
      await updateCard(deck.id, cardId, editForm);
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...editForm } : c))
      );
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Error updating card:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await deleteCard(deck.id, cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  const handleAddCard = async () => {
    setSaving(true);
    try {
      const id = await addCard(deck.id, addForm);
      setCards((prev) => [...prev, { id, ...addForm }]);
      setAdding(false);
      setAddForm({ front: '', back: '', exampleFront: '', exampleBack: '' });
    } catch (err) {
      console.error('Error adding card:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setAdding(false);
    setAddForm({ front: '', back: '', exampleFront: '', exampleBack: '' });
  };

  const handleDeleteDeck = async () => {
    setDeletingDeck(true);
    try {
      await deleteDeck(deck.id);
      onDeckDeleted();
    } catch (err) {
      console.error('Error deleting deck:', err);
      setDeletingDeck(false);
      setShowDeleteDeck(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-light flex items-center justify-center">
        <div className="text-dark/40 text-lg">Loading cards...</div>
      </div>
    );
  }

  const renderCardForm = (form, setForm, onSave, onCancel, isSaving) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-dark/40 block mb-1">{sourceLang.flag} {sourceLang.name}</label>
        <input
          type="text"
          value={form.front}
          onChange={(e) => setForm({ ...form, front: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-secondary focus:outline-none text-base"
          autoFocus={!onSave}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-dark/40 block mb-1">{targetLang.flag} {targetLang.name}</label>
        <input
          type="text"
          value={form.back}
          onChange={(e) => setForm({ ...form, back: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-secondary focus:outline-none text-base"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-dark/40 block mb-1">Example ({sourceLang.code.toUpperCase()})</label>
        <input
          type="text"
          value={form.exampleFront}
          onChange={(e) => setForm({ ...form, exampleFront: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-secondary focus:outline-none text-base"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-dark/40 block mb-1">Example ({targetLang.code.toUpperCase()})</label>
        <input
          type="text"
          value={form.exampleBack}
          onChange={(e) => setForm({ ...form, exampleBack: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-secondary focus:outline-none text-base"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={isSaving || !form.front.trim() || !form.back.trim()}
          className="flex-1 bg-secondary text-white font-semibold rounded-lg py-2 text-sm active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-dark/60 font-semibold rounded-lg py-2 text-sm active:scale-95 transition-transform"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-light safe-area-top flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center border-b border-gray-100">
        <button onClick={onBack} className="text-primary font-medium text-base">
          ←
        </button>
        <h1 className="text-lg font-bold text-dark ml-4 flex-1 truncate">
          {deck.name}
        </h1>
        <span className="text-sm text-dark/40">{cards.length} cards</span>
      </div>

      {/* Card list */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto pb-28">
        {cards.map((card) => (
          <div key={card.id} className="card">
            {editingId === card.id ? (
              renderCardForm(
                editForm,
                setEditForm,
                () => handleSave(card.id),
                handleCancel,
                saving
              )
            ) : (
              /* Card display */
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0" onClick={() => handleEdit(card)}>
                  <p className="font-semibold text-dark text-base truncate">
                    {card.front}
                  </p>
                  <p className="text-dark/50 text-sm truncate">
                    {card.back}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-error/50 hover:text-error text-lg px-1 shrink-0 active:scale-95 transition-all"
                  title="Delete card"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}

        {cards.length === 0 && !adding && (
          <div className="text-center py-12 text-dark/40">
            <p className="text-lg">No cards in this deck</p>
          </div>
        )}

        {/* Add card */}
        {adding ? (
          <div className="card">
            {renderCardForm(
              addForm,
              setAddForm,
              handleAddCard,
              handleCancelAdd,
              saving
            )}
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full border-2 border-dashed border-secondary/50 rounded-xl p-4
              text-secondary font-semibold text-base text-center
              active:bg-secondary/5 transition-colors"
          >
            + Add card
          </button>
        )}
      </div>

      {/* Delete deck button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-100 safe-area-bottom">
        <button
          onClick={() => setShowDeleteDeck(true)}
          className="w-full text-error font-semibold text-base py-3 active:scale-95 transition-transform"
        >
          Delete deck
        </button>
      </div>

      {/* Delete deck confirmation */}
      {showDeleteDeck && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-lg font-bold text-dark mb-2">Delete deck?</p>
            <p className="text-dark/50 text-sm mb-6">
              This will permanently delete "{deck.name}" and all {cards.length} cards. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDeck(false)}
                disabled={deletingDeck}
                className="flex-1 bg-gray-100 text-dark/60 font-semibold rounded-xl py-3 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeck}
                disabled={deletingDeck}
                className="flex-1 bg-error text-white font-semibold rounded-xl py-3 active:scale-95 transition-transform disabled:opacity-50"
              >
                {deletingDeck ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
