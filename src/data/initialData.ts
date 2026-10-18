import type { Folder, Note } from '../types';

export const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'folder-workspace',
    name: 'Workspace',
    parentId: null,
    createdAt: Date.now() - 100000,
    color: '#3b82f6',
  },
  {
    id: 'folder-personal',
    name: 'Personal Notes',
    parentId: null,
    createdAt: Date.now() - 50000,
    color: '#8b5cf6',
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to Markdown Viewer.md',
    folderId: 'folder-workspace',
    isFavorite: true,
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 90000,
    content: `---
title: Welcome to Markdown Viewer
description: Browser-based realtime Markdown editor and viewer with live preview, GFM, math, code syntax, and folder management.
author: Dimas
tags: ["markdown", "live-preview", "gfm", "realtime", "firebase", "cloudflare-pages"]
---

# Welcome to Markdown Viewer

A fast, responsive, and privacy-friendly Markdown workspace built with **React**, **Vite**, **Tailwind CSS**, and **Firebase Realtime Sync**.

## ✨ Key Features
- **Split-Screen Live Preview** with GitHub-Flavored Markdown (GFM) and synced scrolling
- **Folder & Subfolder Management** for clean organization
- **Multi-Tab Editor** to manage multiple drafts simultaneously
- **Realtime Cloud Sync** via Firebase Firestore (free tier) across tabs and devices
- **Drag & Drop / Upload** for local \`.md\` and \`.txt\` files or direct clipboard paste
- **LaTeX Math Support** for scientific equations:
  $$E = mc^2$$
  $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
- **Rich Formatting Toolbar** for bold, italics, headers, quotes, tables, and code snippets
- **Interactive Checklist**:
  - [x] Create project setup with Vite + React + TS
  - [x] Build folder management tree
  - [x] Add CodeMirror 6 with dark theme
  - [x] Configure Firebase realtime sync
  - [ ] Deploy to Cloudflare Pages

---

## 💻 Code with Syntax Highlighting

\`\`\`javascript
// Live preview with copy button
function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

console.log("Welcome to your new notes app!");
\`\`\`

## 📊 Tables & Data

| Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| Folder Management | ✅ Ready | Unlimited sub-folders |
| Realtime Sync | ✅ Ready | Firebase Firestore onSnapshot |
| Multi-tab | ✅ Ready | Buka banyak note sekaligus |
| Drag & Drop Upload | ✅ Ready | Support .md dan .txt |

> **Pro Tip:** You can drag and drop any \`.md\` or \`.txt\` file straight into the explorer sidebar or editor!
`,
  },
  {
    id: 'note-quickguide',
    title: 'Quick Guide.txt',
    folderId: 'folder-workspace',
    isFavorite: false,
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
    content: `PANDUAN PENGGUNAAN CEPAT:

1. Buat Note Baru:
   - Klik tombol "+ File" di atas sidebar Explorer.
   - Atau klik icon '+' di dalam folder yang diinginkan.

2. Manajemen Folder:
   - Klik tombol "+ Folder" untuk membuat folder baru.
   - Kamu bisa drag file ke dalam folder untuk memindahkannya.
   - Klik titik tiga (...) di samping folder untuk Rename atau Hapus.

3. Upload File dari Komputer:
   - Drag & drop file .md atau .txt langsung ke sidebar atau area editor.
   - Atau klik tombol Upload di header Explorer.

4. Realtime Sync dengan Firebase:
   - Buka menu Settings di kanan atas untuk memasukkan kredensial Firebase milikmu.
   - Begitu terhubung, semua catatan otomatis tersinkronisasi realtime antar laptop dan tab!
`,
  },
];
