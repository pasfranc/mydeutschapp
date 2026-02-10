import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

const actionCodeSettings = {
  url: import.meta.env.VITE_APP_URL || 'https://mydeutschapp.web.app',
  handleCodeInApp: true,
};

export const sendMagicLink = async (email) => {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
};

export const completeMagicLinkSignIn = async () => {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Enter your email to confirm');
    }
    if (!email) return null;
    const result = await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    return result.user;
  }
  return null;
};

export const logout = () => signOut(auth);
