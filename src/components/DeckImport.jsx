import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { importDeck } from '../hooks/useFirestore';

export default function DeckImport({ onBack, onImported }) {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.name || !Array.isArray(data.cards)) {
        throw new Error('Formato non valido. Servono "name" e "cards".');
      }

      // Validate cards
      const validCards = data.cards.filter(
        (c) => c.german && c.italian
      );

      if (validCards.length === 0) {
        throw new Error('Nessuna carta valida trovata.');
      }

      const deckId = await importDeck(
        user.uid,
        data.name,
        data.description || '',
        validCards.map((c) => ({
          german: c.german,
          italian: c.italian,
          exampleDE: c.exampleDE || '',
          exampleIT: c.exampleIT || '',
        }))
      );

      onImported(deckId);
    } catch (err) {
      setError(err.message || 'Errore nell\'importazione.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-light safe-area-top">
      {/* Top bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center border-b border-gray-100">
        <button onClick={onBack} className="text-primary font-medium text-base">
          ← Indietro
        </button>
        <h1 className="text-lg font-bold text-dark ml-4">Importa mazzo</h1>
      </div>

      <div className="p-4">
        <div className="card text-center">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-dark/60 text-base mb-6">
            Seleziona un file JSON con il mazzo di carte
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFile}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="btn-primary w-full mb-4"
          >
            {importing ? 'Importazione...' : 'Scegli file JSON'}
          </button>

          {fileName && (
            <p className="text-sm text-dark/40 mb-2">{fileName}</p>
          )}

          {error && (
            <p className="text-error text-sm mt-2">{error}</p>
          )}

          <div className="mt-8 text-left">
            <p className="text-sm font-semibold text-dark/60 mb-2">
              Formato atteso:
            </p>
            <pre className="bg-dark/5 rounded-lg p-3 text-xs text-dark/60 overflow-x-auto">
{`{
  "name": "Nome mazzo",
  "cards": [
    {
      "german": "Wort",
      "italian": "Parola",
      "exampleDE": "Ein Satz",
      "exampleIT": "Una frase"
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
