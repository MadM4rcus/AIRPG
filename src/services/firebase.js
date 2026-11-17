import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy
} from "firebase/firestore";

// Credenciais lidas do .env (nunca hardcoded)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicialização segura
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Garante sessão autenticada anonimamente para salvar no Firestore sem atrito de login
export async function ensureAuth() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn("Autenticação anônima Firebase offline/não habilitada:", e);
    }
  }
  return auth.currentUser;
}

// ==============================================================
// COLEÇÕES ISOLADAS COM PREFIXO OBRIGATÓRIO: airpg_*
// ==============================================================

/**
 * Salva ou atualiza um mundo/bot no Firestore (airpg_profiles)
 */
export async function saveProfileToCloud(profile) {
  try {
    const user = await ensureAuth();
    const docRef = doc(db, "airpg_profiles", profile.id);
    await setDoc(docRef, {
      ...profile,
      userId: user?.uid || "anonymous",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Falha ao sincronizar perfil no Firestore:", err);
    return false;
  }
}

/**
 * Busca todos os mundos/bots salvos na nuvem (airpg_profiles)
 */
export async function loadProfilesFromCloud() {
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, "airpg_profiles"));
    const list = [];
    snap.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    console.warn("Falha ao carregar perfis do Firestore:", err);
    return [];
  }
}

/**
 * Salva mensagens da sessão e o Vault no Firestore (airpg_chats)
 */
export async function saveChatSessionToCloud(profileId, messages, vault, chronicle = '') {
  try {
    const user = await ensureAuth();
    const docRef = doc(db, "airpg_chats", profileId);
    await setDoc(docRef, {
      profileId,
      messages,
      vault,
      chronicle,
      userId: user?.uid || "anonymous",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Falha ao salvar chat no Firestore:", err);
    return false;
  }
}

/**
 * Carrega sessão de chat da nuvem (airpg_chats)
 */
export async function loadChatSessionFromCloud(profileId) {
  try {
    await ensureAuth();
    const docRef = doc(db, "airpg_chats", profileId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Falha ao ler sessão do Firestore:", err);
  }
  return null;
}
