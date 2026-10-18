# Markdown Note - Realtime Workspace

Aplikasi web note dan Markdown viewer modern, cepat, dan responsif dengan live preview split-screen, manajemen folder, upload file `.md` / `.txt`, serta sinkronisasi realtime menggunakan Firebase (Free Spark Tier).

Didesain untuk di-deploy secara gratis dan optimal di **Cloudflare Pages**.

---

## 🚀 Fitur Utama

1. **Split-Screen Editor & Live Preview (Mirip Markdown Viewer)**
   - Editor menggunakan **CodeMirror 6** (sangat cepat, ringan, dengan One Dark theme & line numbers).
   - Live Preview mendukung **GitHub-Flavored Markdown (GFM)**:
     - Tabel, Checkboxes / Task lists, Strikethrough.
     - Rumus Matematika Ilmiah (**LaTeX / KaTeX**): `$E = mc^2$` dan `$$...$$`.
     - Code block syntax highlighting dengan tombol **Copy Code** 1-klik.
     - Visualisasi Metadata YAML frontmatter dalam bentuk tabel rapi.
   - **Synchronized Scrolling**: Scroll di editor otomatis menggeser preview secara proporsional.
   - Mode Tampilan: **Split (50:50)**, **Editor Only**, atau **Preview Only**.

2. **Manajemen Folder (Folder & Sub-Folder Tree)**
   - Buat folder dan sub-folder tanpa batasan kedalaman.
   - Pindahkan catatan antar folder dengan **Drag and Drop** atau via dropdown.
   - Fitur Rename dan Delete folder yang aman (catatan di dalamnya otomatis dialihkan ke root).
   - Filter cepat: **All**, **Recent** (7 hari terakhir), dan **Favs** (Favorit).
   - Pencarian instan (*Search files*) berdasarkan judul dan isi catatan.

3. **Multi-Tab Workspace**
   - Buka beberapa catatan sekaligus dalam tab bar atas layaknya VS Code.
   - Pindah antar tab dengan 1-klik, tutup tab dengan icon 'x'.

4. **Upload File, Input Manual & Copy-Paste**
   - Mendukung file `.md`, `.txt`, `.markdown`, `.text`.
   - **Drag & Drop langsung dari desktop / file explorer Windows** ke dalam sidebar atau folder spesifik.
   - Tombol Upload File di header Explorer.
   - Tombol `+ File` untuk membuat catatan baru instan.

5. **Sinkronisasi Realtime (2 Tab & 2 Laptop)**
   - **Antar Tab di Laptop yang sama**: Menggunakan browser `BroadcastChannel API` (sinkronisasi 0ms latency dan **0 pemakaian kuota database**).
   - **Antar 2 Laptop Berbeda**: Menggunakan Firebase Firestore `onSnapshot`.
   - **Debounced Auto-Save (750ms)**: Menghemat kuota gratis Firebase Spark Tier hingga 98%.
   - **Local-First Fallback**: Sebelum login Firebase, semua catatan tetap tersimpan aman di `localStorage` peramban.

6. **Export Beragam Format**
   - Export ke file Markdown mentah (`.md`).
   - Export ke Standalone HTML lengkap dengan styling.
   - Print / Save as PDF.

---

## 🛠️ Menjalankan Proyek Secara Lokal

Pastikan Node.js sudah terpasang, lalu jalankan:

```bash
# 1. Jalankan development server
npm run dev

# 2. Build untuk production
npm run build

# 3. Preview hasil build
npm run preview
```

---

## ☁️ Menghubungkan Firebase (Free Spark Tier)

Kamu bisa menghubungkan Firebase tanpa perlu rebuild:
1. Jalankan web atau buka di browser.
2. Klik tombol **Connect Cloud** atau ikon **Settings** di pojok kanan atas.
3. Paste objek `firebaseConfig` milikmu dari Firebase Console atau masukkan API Key dan Project ID.

### Langkah Setup di Firebase Console (2 Menit):
1. Buka [console.firebase.google.com](https://console.firebase.google.com) lalu buat proyek baru.
2. Buat **Firestore Database** (pilih lokasi terdekat seperti `asia-southeast2` Jakarta atau `asia-southeast1` Singapura).
3. Di tab **Firestore Rules**, salin dan pasang aturan keamanan berikut:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /notes/{noteId} {
         allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
       }
       match /folders/{folderId} {
         allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid);
       }
     }
   }
   ```
4. Masuk ke menu **Authentication** -> **Sign-in method**, aktifkan penyedia **Google** (atau Anonymous jika ingin uji coba cepat).
5. Masuk ke **Project Settings** (ikon gerigi) -> **General** -> Bagian *Your apps* -> Tambahkan Web App (`</>`), salin `firebaseConfig`.

---

## 🚀 Panduan Deploy ke Cloudflare Pages (Gratis)

1. **Push proyek ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: initial markdown note app"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
2. Buka dashboard [Cloudflare Pages](https://dash.cloudflare.com/) -> **Compute (Workers) & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Pilih repository GitHub proyek ini.
4. Pada **Build Settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. (Opsional) Di bagian **Environment Variables**, kamu bisa menambahkan variabel dari file `.env.example` jika ingin Firebase langsung terhubung otomatis saat build.
6. Klik **Save and Deploy**. Web app kamu akan live dengan domain `.pages.dev` gratis dengan bandwidth tanpa batas!
