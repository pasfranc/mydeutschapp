import { useState } from 'react';
import { sendMagicLink } from '../../utils/auth';

export default function EmailSentScreen({ email, onBack }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendMagicLink(email);
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-7xl mb-6 animate-bounce">✉️</div>

        <h1 className="text-2xl font-bold text-primary mb-3">
          Email sent!
        </h1>

        <p className="text-dark/60 text-lg mb-2">
          Check your inbox and click the link to sign in
        </p>

        <p className="text-secondary font-medium text-base mb-8">{email}</p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="text-primary font-semibold text-base"
        >
          {resending ? 'Sending...' : resent ? 'Sent!' : 'Resend'}
        </button>

        <div className="mt-6">
          <button
            onClick={onBack}
            className="text-dark/40 text-sm"
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}
