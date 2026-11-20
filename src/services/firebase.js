import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// =====================================================================
// DOCUMENTO PRINCIPAL DO USUÁRIO (BYOK, PERSONA, FICHA PADRÃO)
// =====================================================================

export async function loadUserDocFromCloud(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'airpg_users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('Erro ao carregar dados do usuário:', err);
    return null;
  }
}

export async function saveUserDocToCloud(uid, partialData) {
  if (!uid) return false;
  try {
    await setDoc(
      doc(db, 'airpg_users', uid),
      { ...partialData, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Erro ao salvar dados do usuário na nuvem:', err);
    return false;
  }
}

// =====================================================================
// COLEÇÕES SEPARADAS: PERSONAGENS (chat) vs. CAMPANHAS RPG (rpg)
// =====================================================================

function getCollectionNameByType(type) {
  return type === 'rpg' ? 'campaigns' : 'characters';
}

export async function loadCharactersFromCloud(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(collection(db, 'airpg_users', uid, 'characters'));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id, type: 'chat' }));
  } catch (err) {
    console.warn('Erro ao carregar personagens:', err);
    return [];
  }
}

export async function loadCampaignsFromCloud(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(collection(db, 'airpg_users', uid, 'campaigns'));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id, type: 'rpg' }));
  } catch (err) {
    console.warn('Erro ao carregar campanhas RPG:', err);
    return [];
  }
}

export async function saveEntityToCloud(uid, entity) {
  if (!uid || !entity?.id) return false;
  const colName = getCollectionNameByType(entity.type);
  try {
    await setDoc(
      doc(db, 'airpg_users', uid, colName, entity.id),
      { ...entity, type: entity.type || 'chat', updatedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn(`Erro ao salvar em ${colName}:`, err);
    return false;
  }
}

export async function deleteEntityFromCloud(uid, entityId, type = 'chat') {
  if (!uid || !entityId) return false;
  const colName = getCollectionNameByType(type);
  try {
    await deleteDoc(doc(db, 'airpg_users', uid, colName, entityId));
    return true;
  } catch (err) {
    console.warn(`Erro ao excluir de ${colName}:`, err);
    return false;
  }
}

// Compatibilidade legado (caso algum perfil antigo ainda esteja em 'profiles')
export async function loadLegacyProfilesFromCloud(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(collection(db, 'airpg_users', uid, 'profiles'));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (err) {
    return [];
  }
}

// =====================================================================
// HISTÓRICO DE CHATS, VAULT E CHRONICLE
// =====================================================================

export async function loadAllChatsFromCloud(uid) {
  if (!uid) return {};
  try {
    const snap = await getDocs(collection(db, 'airpg_users', uid, 'chats'));
    const map = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data();
    });
    return map;
  } catch (err) {
    console.warn('Erro ao carregar chats:', err);
    return {};
  }
}

export async function saveChatSessionToCloud(uid, sessionId, messages, vault, chronicle) {
  if (!uid || !sessionId) return false;
  try {
    await setDoc(
      doc(db, 'airpg_users', uid, 'chats', sessionId),
      {
        messages: messages || [],
        vault: vault || [],
        chronicle: chronicle || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Erro ao salvar sessão de chat na nuvem:', err);
    return false;
  }
}

// =====================================================================
// BIBLIOTECA COMPARTILHADA (CODEX: MUNDOS, LOCAIS E NPCs REUTILIZÁVEIS)
// =====================================================================

export async function loadCodexFromCloud(uid) {
  if (!uid) return [];
  try {
    const snap = await getDocs(collection(db, 'airpg_users', uid, 'codex'));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.warn('Erro ao carregar Codex:', err);
    return [];
  }
}

export async function saveCodexEntryToCloud(uid, entry) {
  if (!uid || !entry?.id) return false;
  try {
    await setDoc(
      doc(db, 'airpg_users', uid, 'codex', entry.id),
      { ...entry, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Erro ao salvar item no Codex:', err);
    return false;
  }
}

export async function deleteCodexEntryFromCloud(uid, entryId) {
  if (!uid || !entryId) return false;
  try {
    await deleteDoc(doc(db, 'airpg_users', uid, 'codex', entryId));
    return true;
  } catch (err) {
    console.warn('Erro ao excluir item do Codex:', err);
    return false;
  }
}