export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  isTrash?: boolean;
  deletedAt?: number;
  isDone?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  userId?: string;
  color?: string;
}

export type ViewMode = 'split' | 'editor' | 'preview';

export type SyncStatus = 'synced' | 'saving' | 'local' | 'error';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
