# MATHORIA Odyssey — Proyek Visual Studio Code

Media pembelajaran matematika (Numerasi awal, SD, SMP, SMA) dengan 5 dunia misi
(RUPA, JEJAK, SANDIRUANG, PASAR CERDAS, DATARA) dan 3 arcade. Berjalan offline,
hanya butuh **Python 3.10+** (tanpa pip).

## Cara menjalankan di VS Code
1. `File > Open Folder…` → pilih folder `mathoria_project`.
2. Pasang ekstensi yang disarankan (Python) bila diminta.
3. Tekan **F5** (atau `Ctrl+Shift+B`), browser terbuka di http://127.0.0.1:8765/
   Atau di terminal: `python app.py`  (`--port 8766` bila port terpakai).

## Struktur
```
app.py               server lokal (pengganti peluncur tersemat)
build_single.py      gabungkan semua jadi 1 file: dist/MATHORIA_Odyssey.py
index.html           kerangka halaman
src/css/style.css    seluruh gaya
src/js/icons.js      ikon SVG
src/js/data.js       TRACKS, GAMES, MISSIONS  <- edit materi & soal di sini
src/js/engine.js     mesin pemeriksa jawaban
src/js/puzzles.js    manipulatif (ubin, diagram, dsb.)
src/js/game-state.js simpanan kemajuan, XP, lencana
src/js/game-art.js   ilustrasi adegan
src/js/game-arcade.js tiga arcade
src/js/game-app.js   tampilan & navigasi utama
assets/              font Noto Sans (OFL 1.1) dan gambar
.vscode/             launch, tasks, settings
```
Urutan `<script>` di `index.html` penting: semua modul berbagi lingkup global.

## Mengubah materi
Buka `src/js/data.js`. Tiap misi dibuat dengan `mission(judul, topik, tujuan,
prasyarat, lesson(...), [soal...])`. Jenis soal: `n()` angka, `choice()` pilihan,
`repair()` perbaiki catatan. Simpan, lalu muat ulang browser.

## Lisensi
Kode MIT; font Noto Sans memakai SIL Open Font License 1.1.
