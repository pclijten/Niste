/**
 * main.js — Niste Firebase Module
 * Gebruik: importeer functies die je nodig hebt in andere pagina's.
 *
 * Vereiste: Firebase v10 modular SDK via CDN
 * Compatibel met GitHub Pages (geen backend vereist)
 */

import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         deleteUser, onAuthStateChanged,
         updateProfile }                        from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc,
         updateDoc, deleteDoc, collection,
         query, where, getDocs,
         serverTimestamp }                      from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATIE
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDkrkHrPW4pPu0_ZVKGma-AVF4-gTtk9R8",
  authDomain:        "niste-1113e.firebaseapp.com",
  projectId:         "niste-1113e",
  storageBucket:     "niste-1113e.firebasestorage.app",
  messagingSenderId: "292138618317",
  appId:             "1:292138618317:web:50984a6bff31725d6a0884",
  measurementId:     "G-G76HYMMP86"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };

// ─────────────────────────────────────────────────────────────────────────────
// AUTH STATE OBSERVER
// Gebruik: onAuthChange((user) => { ... })
// ─────────────────────────────────────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER USER
// Maakt Firebase Auth account + Firestore user document aan.
// Vereist: naam, email, wachtwoord, consent (boolean)
// Geeft terug: { success: true, uid } of { success: false, error: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function registerUser({ name, email, password, consent }) {
  if (!name || !email || !password) {
    return { success: false, error: "Vul alle velden in." };
  }
  if (password.length < 8) {
    return { success: false, error: "Wachtwoord moet minimaal 8 tekens zijn." };
  }
  if (!consent) {
    return { success: false, error: "Je moet akkoord gaan met de privacyverklaring." };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Maak Firestore user document aan
    await setDoc(doc(db, "users", cred.user.uid), {
      uid:         cred.user.uid,
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      preferences: {},
      consentAt:   new Date().toISOString(),  // AVG: bewijs van toestemming
      createdAt:   serverTimestamp()
    });

    return { success: true, uid: cred.user.uid };
  } catch (e) {
    return { success: false, error: _mapAuthError(e.code) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN USER
// Geeft terug: { success: true, user } of { success: false, error: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function loginUser({ email, password }) {
  if (!email || !password) {
    return { success: false, error: "Vul je e-mail en wachtwoord in." };
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: _mapAuthError(e.code) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Uitloggen mislukt." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ACCOUNT (AVG: recht op verwijdering)
// Verwijdert: Auth user + Firestore user doc + bijbehorende matches
// Geeft terug: { success: true } of { success: false, error: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Niet ingelogd." };

  try {
    // 1. Verwijder Firestore user document
    await deleteDoc(doc(db, "users", user.uid));

    // 2. Verwijder alle matches van deze gebruiker
    const matchQ = query(
      collection(db, "matches"),
      where("userId", "==", user.uid)
    );
    const matchSnap = await getDocs(matchQ);
    const deletions = matchSnap.docs.map(m => deleteDoc(m.ref));
    await Promise.all(deletions);

    // 3. Verwijder Firebase Auth account
    await deleteUser(user);

    return { success: true };
  } catch (e) {
    if (e.code === "auth/requires-recent-login") {
      return {
        success: false,
        error:   "Log opnieuw in en probeer opnieuw (beveiligingsmaatregel)."
      };
    }
    return { success: false, error: "Verwijderen mislukt. Probeer opnieuw." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET USER DATA
// Haalt Firestore user document op voor de huidige gebruiker
// ─────────────────────────────────────────────────────────────────────────────
export async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE USER PREFERENCES
// Werkt de woonvoorkeuren bij in het Firestore user document
// ─────────────────────────────────────────────────────────────────────────────
export async function updatePreferences(preferences) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Niet ingelogd." };
  try {
    await updateDoc(doc(db, "users", user.uid), {
      preferences,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: "Opslaan mislukt." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE CONSENT (localStorage – geen tracking)
// ─────────────────────────────────────────────────────────────────────────────
const COOKIE_KEY = "niste_cookie_consent";

export const cookieConsent = {
  get:     ()       => localStorage.getItem(COOKIE_KEY),
  accept:  ()       => localStorage.setItem(COOKIE_KEY, "accepted"),
  decline: ()       => localStorage.setItem(COOKIE_KEY, "declined"),
  isSet:   ()       => !!localStorage.getItem(COOKIE_KEY)
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNE HELPER: Auth error mapping (NL)
// ─────────────────────────────────────────────────────────────────────────────
function _mapAuthError(code) {
  const map = {
    "auth/email-already-in-use": "Dit e-mailadres is al in gebruik.",
    "auth/invalid-email":        "Ongeldig e-mailadres.",
    "auth/weak-password":        "Wachtwoord is te zwak (gebruik min. 8 tekens).",
    "auth/user-not-found":       "Geen account gevonden met dit e-mailadres.",
    "auth/invalid-credential":   "E-mail of wachtwoord is onjuist.",
    "auth/wrong-password":       "Wachtwoord onjuist.",
    "auth/too-many-requests":    "Te veel pogingen. Wacht even en probeer opnieuw.",
    "auth/network-request-failed": "Geen internetverbinding. Controleer je netwerk."
  };
  return map[code] || `Onbekende fout (${code}). Probeer opnieuw.`;
}
