import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import WelcomeScreen from './WelcomeScreen';
import EmailSentScreen from './EmailSentScreen';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const [sentEmail, setSentEmail] = useState(null);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center gradient-bg">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">🇩🇪</div>
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (sentEmail) {
      return (
        <EmailSentScreen
          email={sentEmail}
          onBack={() => setSentEmail(null)}
        />
      );
    }
    return <WelcomeScreen onEmailSent={setSentEmail} />;
  }

  return children;
}
