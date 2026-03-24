import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getAuth }                         from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';
import { getFirestore }                    from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyDkrkHrPW4pPu0_ZVKGma-AVF4-gTtk9R8",
  authDomain:        "niste-1113e.firebaseapp.com",
  projectId:         "niste-1113e",
  storageBucket:     "niste-1113e.firebasestorage.app",
  messagingSenderId: "292138618317",
  appId:             "1:292138618317:web:50984a6bff31725d6a0884",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db   = getFirestore(app);
