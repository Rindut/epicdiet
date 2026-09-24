# Epic Diet Tracker

## Account and sync implementation

The local development version now requires a private account. See
[ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) for setup, credentials, migration, and
production prerequisites. Run `npm run setup-account` once before `npm run dev`.
Cloud sync is not live until a persistent database and Vercel environment
variables are configured. The previous browser-only notes below document the
legacy data that is preserved for explicit migration.

Tracker pribadi berdasarkan `weight-tracker-prd-v1.md` dan empat wireframe v2. UI Bahasa Indonesia dan English, responsif untuk mobile browser dan desktop.

Switcher **EN / IN** di kanan atas tersedia pada onboarding dan semua halaman. IN berarti Bahasa Indonesia; kode bahasa internal tetap `id`. Pilihan tersimpan sebagai preferensi browser (`epic-language`). Pergantian bahasa berlangsung tanpa reload atau penggantian form, sehingga draft, posisi kursor, catatan pribadi dan target tersimpan tidak berubah. Label, tooltip, dialog, pesan validasi, angka tampilan dan tanggal antarmuka diterjemahkan; nilai input dan CSV tetap sesuai data asli.

## Jalankan di komputer ini

Butuh Node.js 20 atau lebih baru. Tidak ada dependency yang perlu diinstal.

```sh
cd "/Users/rina/codex/Epic Diet Tracker/app"
npm run dev
```

Buka **http://localhost:3040**. Port 3040 dipilih karena tidak tercantum sebagai port terpakai atau port yang harus dihindari dalam `/Users/rina/Dev/LOCAL_PORT_MAP.md`. Server memakai port tetap dan gagal jika port sudah dipakai; tidak otomatis pindah ke port lain. Server hanya mendengarkan loopback komputer ini, tidak dipublikasikan.

Gunakan alamat yang sama setiap kali. `localhost` dan `127.0.0.1` adalah origin penyimpanan yang berbeda. Localhost pada ponsel juga merujuk ke ponsel, bukan komputer ini. Akses dari ponsel fisik memerlukan konfigurasi jaringan terpisah.

## Yang tersedia

- Onboarding: konfirmasi tanggal mulai, profil, target kebiasaan dan goal 60/65 kg.
- Dashboard: CTA harian, rata-rata valid, Epic aktif, target berikutnya, MVD dan konsistensi.
- Catatan Harian: simpan parsial, edit, pindah tanggal tanpa menimpa, bantuan target, MVD langsung, peringatan draft, hapus dan undo 10 detik.
- Review Mingguan: kalender Senin–Minggu, rata-rata minimal tiga timbang, coverage tiap kebiasaan, skor gabungan, tren tiga minggu selesai, grafik titik dan refleksi opsional.
- Roadmap: milestone dari minggu selesai, gembok SVG, status yang sama dengan Dashboard, koreksi riwayat dan keputusan fase opsional di 65 kg.
- Pengaturan: profil, target bertanggal, target latihan mulai Senin berikutnya, riwayat target, ekspor seluruh entitas ke CSV dan hapus seluruh data.

## Data dan privasi

Data disimpan pada IndexedDB di browser yang digunakan, dalam satu record transaksi atomik. Berat awal adalah profil, bukan catatan timbang otomatis. Tidak ada data simulasi yang dimasukkan ke origin utama, layanan cloud, akun, analytics, font eksternal atau pengiriman data kesehatan ke server.

Menyimpan menambah revision; tab dengan revision lama ditolak agar tidak menimpa data tab lain. Jika konflik, salin isian yang dibutuhkan lalu muat ulang. Input tetap tersedia setelah error.

Menghapus data browser dapat menghapus seluruh perjalanan. CSV mencakup profil, target bertanggal, daily entries, refleksi, keputusan dan versi skema. Teks bebas dilindungi dari formula spreadsheet. CSV adalah ekspor untuk dibaca, **bukan format restore**; import belum termasuk MVP.

## Struktur

```text
dist/index.html    Entry dan metadata halaman
dist/app.js        Render UI, navigasi, interaksi dan transaksi
dist/core.js       Perhitungan murni sesuai PRD
dist/storage.js    IndexedDB dan proteksi konflik revision
dist/i18n.js       Katalog terjemahan dan preferensi EN/IN
dist/style.css    Layout mobile/desktop dan aksesibilitas
dist/favicon.svg  Identitas aplikasi
tools/dev-server.mjs  Server statis localhost:3040 (khusus lokal)
tests/            Kasus penerimaan dan batas perhitungan
```

Semua halaman menggunakan fungsi perhitungan yang sama. Tidak ada salinan skor terpisah per halaman. Target kebiasaan tersimpan sebagai perubahan bertanggal; riwayat memakai versi pada tanggal masing-masing.

## Pengujian

```sh
npm test
npm run check
```

Lihat `VALIDATION.md` untuk cakupan dan keterbatasan pengujian. Angka uji bukan riwayat pengguna.

## Batas rilis lokal

Belum ada akun, sinkronisasi, import/restore, PWA offline penuh, wearable atau notifikasi. Tinggi tidak dipakai untuk diagnosis atau penetapan target medis. Fase 65 → 60 kg tetap opsional.
