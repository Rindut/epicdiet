# Validasi implementasi lokal

## Pembaruan EN / IN

Switcher bahasa tersedia di kanan atas semua halaman termasuk onboarding. Total **32 tes otomatis lulus**: 26 aturan produk dan 6 cakupan terjemahan. Uji browser membuktikan EN tetap aktif setelah reload, pergantian EN → IN → EN mempertahankan draft protein, catatan bebas dan tooltip terbuka, serta dialog draft tampil sesuai bahasa. Data uji tetap di origin 127.0.0.1; origin pengguna tidak diberi data contoh.

Onboarding, Dashboard, Daily Tracker, Weekly Review, Roadmap dan Settings diperiksa dalam English. Audit empat halaman inti dan Settings pada lebar 360 px tidak menemukan scroll horizontal. Tombol EN/IN menyertakan nama aksesibel serta `aria-pressed`; bahasa dokumen mengikuti pilihan. UI diperbarui di tempat agar state isian tidak berubah.

Tanggal: 22 September 2026. Acuan: PRD v1.0. Runtime pengujian: Node.js v20.20.2 di macOS dan browser terintegrasi Codex.

## Uji perhitungan otomatis

26 kasus awal lulus, mencakup:

- Average 81,6 kg dari lima catatan dan hari kosong tanpa interpolasi.
- Minimal tiga tanggal timbang, delta antar-minggu yang bersebelahan, celah data dan tren hanya dari minggu selesai.
- Skor 73,81% dibulatkan 74%, nutrisi minimum berbeda dari skor nutrisi.
- Coverage per field, skor sementara, dua minggu lengkap <40%, dan minggu tidak lengkap memutus urutan.
- Batas kontribusi latihan, tiga keadaan MVD dan denominator hari yang telah berlangsung.
- Progress, fallback sumber Dashboard, batas average 75,04, pembukaan Epic tepat di 75 dan fluktuasi sesudah pencapaian.
- Koreksi riwayat, fase opsional, target historis, penjadwalan latihan, input parsial, nol, koma desimal, dan tanggal tidak sah.
- Zona waktu perjalanan, CSV multiline/quote/null/formula, baseline dikoreksi, serta durasi 12–18 minggu.

## Uji alur melalui browser

Dijalankan pada origin uji `127.0.0.1:3040`, terpisah dari `localhost:3040` yang diserahkan untuk penggunaan sebenarnya.

- Onboarding menyimpan profil, tidak mengisi catatan timbang otomatis.
- Menyimpan form kosong ditolak; input kosong tetap berbeda dari nol.
- Input `82,0`, protein 80 g, nutrisi kuning dan gerak tercapai menampilkan MVD dua tindakan.
- Navigasi dengan draft meminta simpan/buang/tetap. Simpan-lalu-lanjut memperbarui Review Mingguan.
- Catatan dan refleksi bertahan setelah reload.
- Tiga catatan 75 kg pada minggu selesai membuka Epic 2 dan target 72 kg; milestone 70 kg tetap terkunci.
- Target protein 100 g disimpan berlaku hari berikutnya; latihan 2 sesi berlaku Senin berikutnya. Catatan hari ini tetap memakai 90 g dan 3 sesi.
- Ekspor men-trigger unduhan CSV dan mencatat waktu ekspor.
- Hapus satu catatan mengubah pencapaian; undo memulihkan entry.
- Pemindahan ke tanggal yang sudah terisi ditolak dan menawarkan membuka entry tujuan.
- Konflik dua tab menolak penyimpanan kedua, mempertahankan input dan tidak mengganti status menjadi tersimpan.
- Tool navigasi WebMCP terdaftar, navigasi valid bekerja dan nama halaman invalid ditolak. Tool tidak mengeluarkan riwayat kesehatan.

## Tampilan

Dashboard, Catatan Harian, Review Mingguan, Roadmap dan Pengaturan dibangun responsif. Screenshot mobile diperiksa pada 390 px dan 360 px. Audit final kelima halaman pada 360 px menghasilkan `documentElement.scrollWidth = innerWidth = 360`, tanpa scroll horizontal. Percobaan override 430 px tidak mengubah ukuran tab uji (pengukuran tetap 360 px), sehingga tidak diklaim sebagai pengujian 430 px yang terpisah.

## Belum dibuktikan pada perangkat fisik

- Safari iOS dan Chrome Android pada perangkat fisik belum tersedia dalam sesi ini.
- Target feedback simpan <1 detik untuk dua tahun riwayat belum diukur pada perangkat mobile fisik.
- Blokir/quota IndexedDB oleh sistem belum disimulasikan; jalur kegagalan save diuji melalui konflik revision nyata.
- Dialog hapus seluruh data diimplementasikan; penghapusan permanen seluruh data tidak dijalankan pada origin pengguna.

MVP ini siap dicoba secara lokal. Dokumen ini tidak mengklaim sertifikasi lintas-browser atau hasil uji penggunaan 60 detik sebelum pilot nyata.
