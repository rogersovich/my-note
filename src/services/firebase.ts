import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  signInAnonymously
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import type { Firestore, Unsubscribe } from 'firebase/firestore';
import type { Note, Folder, UserProfile } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY_CONFIG = 'mynote_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  // Check Vite env variables first if available
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored Firebase config', e);
  }

  return null;
}

export function saveStoredFirebaseConfig(config: FirebaseConfig | null) {
  if (config) {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } else {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  }
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

export function initFirebase(config?: FirebaseConfig | null) {
  const cfg = config || getStoredFirebaseConfig();
  if (!cfg || !cfg.apiKey || !cfg.projectId) {
    return { app: null, db: null, auth: null };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(cfg);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    return { app, db, auth };
  } catch (err) {
    console.error('Error initializing Firebase:', err);
    return { app: null, db: null, auth: null };
  }
}

// Initialize on load if config exists
initFirebase();

export async function loginWithGoogle(): Promise<UserProfile | null> {
  if (!auth) {
    const res = initFirebase();
    if (!res.auth) throw new Error('Firebase belum dikonfigurasi. Silakan isi konfigurasi Firebase di menu Settings.');
  }
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth!, provider);
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName,
    photoURL: cred.user.photoURL,
  };
}

export async function loginAnonymously(): Promise<UserProfile | null> {
  if (!auth) {
    const res = initFirebase();
    if (!res.auth) throw new Error('Firebase belum dikonfigurasi.');
  }
  const cred = await signInAnonymously(auth!);
  return {
    uid: cred.user.uid,
    email: null,
    displayName: 'Anonymous User',
    photoURL: null,
  };
}

export async function logoutFirebase(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
}

export function subscribeAuth(callback: (user: UserProfile | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL,
      });
    } else {
      callback(null);
    }
  });
}

// Realtime sync listeners for Firestore
export function subscribeToUserData(
  userId: string,
  onNotesUpdate: (notes: Note[]) => void,
  onFoldersUpdate: (folders: Folder[]) => void
): () => void {
  if (!db) return () => {};

  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Subscribe to notes
    const notesQuery = query(collection(db, 'notes'), where('userId', '==', userId));
    const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
      const notes: Note[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notes.push({
          id: docSnap.id,
          title: data.title || 'Untitled',
          content: data.content || '',
          folderId: data.folderId ?? null,
          isFavorite: Boolean(data.isFavorite),
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          userId: data.userId,
          isTrash: Boolean(data.isTrash),
          deletedAt: data.deletedAt || undefined,
        });
      });
      onNotesUpdate(notes);
    }, (error) => {
      console.error('Firestore notes subscription error:', error);
    });
    unsubs.push(unsubNotes);

    // 2. Subscribe to folders
    const foldersQuery = query(collection(db, 'folders'), where('userId', '==', userId));
    const unsubFolders = onSnapshot(foldersQuery, (snapshot) => {
      const folders: Folder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        folders.push({
          id: docSnap.id,
          name: data.name || 'Untitled Folder',
          parentId: data.parentId ?? null,
          createdAt: data.createdAt || Date.now(),
          userId: data.userId,
          color: data.color || '#3b82f6',
        });
      });
      onFoldersUpdate(folders);
    }, (error) => {
      console.error('Firestore folders subscription error:', error);
    });
    unsubs.push(unsubFolders);
  } catch (err) {
    console.error('Failed to setup Firestore listeners:', err);
  }

  return () => {
    unsubs.forEach(u => u());
  };
}

// Remote write helpers
export async function syncNoteToFirestore(note: Note): Promise<void> {
  if (!db || !note.userId) return;
  const noteRef = doc(db, 'notes', note.id);
  await setDoc(noteRef, {
    title: note.title,
    content: note.content,
    folderId: note.folderId,
    isFavorite: note.isFavorite,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    userId: note.userId,
    isTrash: Boolean(note.isTrash),
    deletedAt: note.deletedAt || null,
  }, { merge: true });
}

export async function deleteNoteFromFirestore(noteId: string): Promise<void> {
  if (!db) return;
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
}

export async function syncFolderToFirestore(folder: Folder): Promise<void> {
  if (!db || !folder.userId) return;
  const folderRef = doc(db, 'folders', folder.id);
  await setDoc(folderRef, {
    name: folder.name,
    parentId: folder.parentId,
    createdAt: folder.createdAt,
    userId: folder.userId,
    color: folder.color || '#3b82f6',
  }, { merge: true });
}

export async function deleteFolderFromFirestore(folderId: string): Promise<void> {
  if (!db) return;
  const folderRef = doc(db, 'folders', folderId);
  await deleteDoc(folderRef);
}
