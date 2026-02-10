import { useState } from 'react';
import { sendMagicLink } from '../../utils/auth';

export default function WelcomeScreen({ onEmailSent }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendMagicLink(email.trim());
      onEmailSent(email.trim());
    } catch (err) {
      setError('Failed to send. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-dvh gradient-bg flex items-center justify-center p-4">
      <div className="card w-full max-w-sm mx-auto text-center p-8">
        <div className="text-6xl mb-4">🇩🇪</div>
        <h1 className="text-2xl font-bold text-dark mb-2">myDeutschApp</h1>
        <p className="text-dark/60 mb-8 text-base">
          Learn German with flashcards and spaced repetition
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full h-14 px-4 text-lg rounded-xl border-2 border-gray-200
              focus:border-secondary focus:outline-none transition-colors"
            autoComplete="email"
            inputMode="email"
            required
          />

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Get sign-in link'}
          </button>
        </form>

      </div>
    </div>
  );
}
