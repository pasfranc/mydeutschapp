import { useState } from 'react';

export default function StudyOptions({ deck, onStart, onBack }) {
  const [mode, setMode] = useState('flashcard');
  const [direction, setDirection] = useState('de-it');
  const [size, setSize] = useState(20);
  const [customSize, setCustomSize] = useState('');

  const sizes = [
    { label: 'Piccolo', value: 20 },
    { label: 'Medio', value: 40 },
    { label: 'Lungo', value: 60 },
    { label: 'Custom', value: 'custom' },
  ];

  const effectiveSize = size === 'custom' ? (parseInt(customSize, 10) || 1) : size;

  return (
    <div className="min-h-dvh bg-light safe-area-top flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex items-center border-b border-gray-100">
        <button onClick={onBack} className="text-primary font-medium text-base">
          ←
        </button>
        <h1 className="text-lg font-bold text-dark ml-4">Opzioni</h1>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-28">
        {/* Mode selection */}
        <div>
          <h2 className="text-lg font-bold text-dark mb-3 flex items-center gap-2">
            🎯 Modalita
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setMode('flashcard')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                mode === 'flashcard'
                  ? 'border-secondary bg-secondary/5'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'flashcard'
                      ? 'border-secondary'
                      : 'border-gray-300'
                  }`}
                >
                  {mode === 'flashcard' && (
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-dark text-base">
                    🎴 Flashcard
                  </span>
                  <p className="text-sm text-dark/50 mt-0.5">
                    Riconosci il termine
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('translation')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                mode === 'translation'
                  ? 'border-secondary bg-secondary/5'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'translation'
                      ? 'border-secondary'
                      : 'border-gray-300'
                  }`}
                >
                  {mode === 'translation' && (
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-dark text-base">
                    ✍️ Translation
                  </span>
                  <p className="text-sm text-dark/50 mt-0.5">
                    Scrivi la frase
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Direction selection */}
        <div>
          <h2 className="text-lg font-bold text-dark mb-3 flex items-center gap-2">
            🔄 Direzione
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setDirection('de-it')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                direction === 'de-it'
                  ? 'border-secondary bg-secondary/5'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    direction === 'de-it'
                      ? 'border-secondary'
                      : 'border-gray-300'
                  }`}
                >
                  {direction === 'de-it' && (
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  )}
                </div>
                <span className="font-semibold text-dark text-base">
                  🇩🇪 → 🇮🇹
                </span>
              </div>
            </button>

            <button
              onClick={() => setDirection('it-de')}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                direction === 'it-de'
                  ? 'border-secondary bg-secondary/5'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    direction === 'it-de'
                      ? 'border-secondary'
                      : 'border-gray-300'
                  }`}
                >
                  {direction === 'it-de' && (
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                  )}
                </div>
                <span className="font-semibold text-dark text-base">
                  🇮🇹 → 🇩🇪
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Session length */}
        <div>
          <h2 className="text-lg font-bold text-dark mb-3 flex items-center gap-2">
            📏 Lunghezza sessione
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {sizes.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className={`p-4 rounded-xl border-2 transition-colors text-center ${
                  size === s.value
                    ? 'border-secondary bg-secondary/5'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="font-semibold text-dark text-base block">
                  {s.label}
                </span>
                {s.value !== 'custom' && (
                  <span className="text-sm text-dark/50">{s.value} carte</span>
                )}
              </button>
            ))}
          </div>

          {size === 'custom' && (
            <div className="mt-3">
              <input
                type="number"
                min="1"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Numero di carte"
                className="w-full h-14 px-4 text-lg rounded-xl border-2 border-gray-200
                  focus:border-secondary focus:outline-none transition-colors"
                inputMode="numeric"
              />
              {customSize && parseInt(customSize, 10) > deck.totalCards && (
                <p className="text-sm text-dark/40 mt-2">
                  Il mazzo ha {deck.totalCards} carte, verranno ripetute per arrivare a {customSize}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 border-t border-gray-100 safe-area-bottom">
        <button
          onClick={() => onStart(mode, direction, effectiveSize)}
          disabled={size === 'custom' && (!customSize || parseInt(customSize, 10) < 1)}
          className="btn-primary w-full text-lg disabled:opacity-50"
        >
          Inizia ({effectiveSize} carte)
        </button>
      </div>
    </div>
  );
}
