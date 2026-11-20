import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc
} from "firebase/firestore";

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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Login com Google (Gmail)
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Logout
export async function logoutUser() {
  await signOut(auth);
}

// Observador de sessão (avisa o app quando o usuário entra ou sai)
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ==============================================================
// DADOS ISOLADOS POR USUÁRIO: airpg_users/{uid}
// ==============================================================

// Salva configurações do usuário (chaves BYOK, persona ou ficha)
export async function saveUserDocToCloud(uid, partialData) {
  if (!uid) return false;
  try {
    const docRef = doc(db, "airpg_users", uid);
    await setDoc(docRef, {
      ...partialData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Falha ao salvar dados do usuário no Firestore:", err);
    return false;
  }
}

// Carrega documento principal do usuário (chaves, persona, ficha)
export async function loadUserDocFromCloud(uid) {
  if (!uid) return null;
  try {
    const docRef = doc(db, "airpg_users", uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("Falha ao ler dados do usuário no Firestore:", err);
    return null;
  }
}

// Salva um mundo/personagem do usuário
export async function saveProfileToCloud(uid, profile) {
  if (!uid || !profile?.id) return false;
  try {
    const docRef = doc(db, "airpg_users", uid, "profiles", profile.id);
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Falha ao salvar perfil no Firestore:", err);
    return false;
  }
}

// Exclui um mundo/personagem do usuário
export async function deleteProfileFromCloud(uid, profileId) {
  if (!uid || !profileId) return false;
  try {
    const docRef = doc(db, "airpg_users", uid, "profiles", profileId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn("Falha ao excluir perfil no Firestore:", err);
    return false;
  }
}

// Carrega todos os mundos/personagens do usuário
export async function loadProfilesFromCloud(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(collection(db, "airpg_users", uid, "profiles"));
    const list = [];
    snap.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    console.warn("Falha ao carregar perfis do Firestore:", err);
    return [];
  }
}

// Salva mensagens, Vault e Crônica de um chat específico do usuário
export async function saveChatSessionToCloud(uid, profileId, messages, vault, chronicle = '') {
  if (!uid || !profileId) return false;
  try {
    const docRef = doc(db, "airpg_users", uid, "chats", profileId);
    await setDoc(docRef, {
      profileId,
      messages,
      vault,
      chronicle,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Falha ao salvar chat no Firestore:", err);
    return false;
  }
}

// Carrega todos os chats salvos do usuário
export async function loadAllChatsFromCloud(uid) {
  if (!uid) return {};
  try {
    const snap = await getDocs(collection(db, "airpg_users", uid, "chats"));
    const chatsMap = {};
    snap.forEach((d) => {
      chatsMap[d.id] = d.data();
    });
    return chatsMap;
  } catch (err) {
    console.warn("Falha ao ler chats do Firestore:", err);
    return {};
  }
}