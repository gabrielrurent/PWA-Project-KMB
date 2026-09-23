# Menyambungkan PWA ini ke spreadsheet MAR Anda sendiri

Panduan untuk menjalankan salinan ini di atas **spreadsheet dan Apps Script
Anda sendiri**.

> **Jangan mengisinya dengan URL deployment milik orang lain.** PWA ini menulis
> data kerja yang menentukan gaji. Kalau diarahkan ke sistem yang sedang dipakai
> orang lain, tulisannya masuk ke sana — dan tidak ada galat apa pun yang
> memberi tahu bahwa itu terjadi.

---

## Yang harus Anda punya lebih dulu

PWA ini **hanya antarmuka**. Seluruh logika — perhitungan poin, alur approval,
payroll — ada di backend Google Apps Script yang **tidak ikut di repositori
ini**.

Jadi Anda butuh dua hal sebelum mulai:

1. **Spreadsheet MAR** dengan sheet `WorkOrders`, `WorkOrderTeam`,
   `MechanicPoints`, `Config_Mechanics`, `ApiTokens`, dan seterusnya
2. **Project Apps Script** yang terikat ke spreadsheet itu dan menyediakan
   kontrak API di bawah

Tanpa keduanya, PWA ini akan terbuka tapi tidak menampilkan apa-apa.

---

## Kontrak API yang harus disediakan backend

PWA mengirim **POST** ke satu URL, dengan `Content-Type: text/plain`, berisi:

```json
{ "token": "<token mekanik>", "action": "<nama aksi>", "data": { }, "op_id": "<id unik>" }
```

Jawaban yang diharapkan:

```json
{ "success": true,  "result": { } }
{ "success": false, "error": "pesan yang bisa dibaca manusia" }
{ "success": false, "retry_later": true, "error": "sistem sedang ramai" }
```

`retry_later` penting: ia berarti **"coba lagi nanti"**, bukan "gagal". PWA
menahan operasinya di antrean alih-alih menandainya merah.

### Aksi yang dipanggil

**Membaca** — tanpa `op_id`:

```
ping                 pull_my_wos          pull_create_refs
pull_pending         pull_active          pull_approved
pull_rejected        pull_transfers       pull_monitoring
get_vapid_key
```

**Menulis** — `op_id` wajib:

```
create_wo            submit_work          cancel_wo
save_override        reject               request_transfer
approve_transfer     reject_transfer      save_push_sub
```

### Dua hal yang wajib ada di backend

**Dedup `op_id`.** Simpan tiap `op_id` yang pernah dieksekusi dan tolak yang
kembar. PWA mengirim ulang saat sinyal kembali, dan halaman maupun service
worker bisa mengirim operasi yang sama nyaris bersamaan. Tanpa dedup, satu
pekerjaan tercatat dua kali — dan di sistem yang menentukan gaji, itu berarti
bayar dua kali.

**Kunci di sekeliling blok tulis.** Baca-lalu-tulis tanpa kunci akan
bertabrakan. Ini bukan kekhawatiran teoretis: pernah terjadi dua operasi
sama-sama membaca "belum pernah dieksekusi" lalu sama-sama dijalankan.

---

## Langkah menyambungkan

### 1. Deploy backend Anda sebagai Web App

Di editor Apps Script: **Deploy → New deployment → Web app**

| setelan | nilai |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

"Anyone" terdengar menakutkan, tapi keamanannya tidak bersandar pada setelan
ini — melainkan pada **token** di tiap permintaan. Tanpa token yang sah, semua
aksi ditolak.

Salin URL `/exec` yang diberikan.

### 2. Isi URL itu di DUA tempat

**`app.js`**, dekat baris atas:

```javascript
var CONFIG = { API_URL: 'https://script.google.com/macros/s/XXXXX/exec' };
```

**`sw.js`**:

```javascript
var API_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```

Harus **sama persis**. Service worker tidak bisa membaca variabel dari halaman,
jadi nilainya memang ditulis dua kali. Kalau berbeda, halaman dan service worker
bicara ke dua sistem berlainan — dan gejalanya nyaris mustahil dibaca: sebagian
data masuk, sebagian tidak, tanpa pola.

### 3. Naikkan DUA nomor versi

```javascript
// app.js
var APP_VERSION = 'v1';

// sw.js
var CACHE = 'mar-v1';
```

Keduanya, tiap kali merilis. Kalau hanya satu yang naik, peramban memuat kode
baru di atas cache lama. Di proyek aslinya pernah tertinggal berhari-hari:
`APP_VERSION` masih v26 sementara `CACHE` sudah v34.

### 4. Hosting

Berkasnya statis, jadi hosting apa pun bisa — GitHub Pages, Netlify, Cloudflare
Pages.

Satu syarat mutlak: **HTTPS**. Service worker, background sync, dan notifikasi
tidak jalan di HTTP. (`localhost` dikecualikan untuk pengembangan.)

### 5. Buat token untuk tiap pengguna

Tiap orang masuk lewat tautan bertoken:

```
https://<hosting-anda>/index.html?token=<token-orang-itu>
```

Backend harus mencocokkan token itu ke satu orang dan perannya. Token disimpan
PWA di IndexedDB, jadi cukup dibuka sekali.

---

## Memastikan sambungannya benar

Buka PWA, lalu di DevTools → Network perhatikan permintaan `ping`.

| yang terlihat | artinya |
|---|---|
| `success: true` | tersambung ✓ |
| CORS / gagal fetch | URL salah, atau deployment belum "Anyone" |
| halaman login Google | akses masih "Only myself" |
| `success: false`, soal token | tersambung, tapi tokennya belum sah |

Kalau sudah tersambung tapi layarnya kosong, periksa `pull_my_wos`: sambungannya
hidup, tapi orang itu belum punya WO — atau `token` belum terpetakan ke mekanik
mana pun.

---

## Kalau sesuatu terasa aneh

**Perubahan tidak muncul di HP** — hampir selalu versi yang tidak dinaikkan.
Naikkan `APP_VERSION` dan `CACHE`, lalu tutup penuh aplikasinya sekali.

**Operasi tersangkut di outbox** — itu memang rancangannya saat sinyal hilang.
Ia terkirim sendiri saat sinyal kembali. Kalau bertanda merah (`failed`), baca
pesannya: yang berbunyi "sibuk" aman dicoba lagi.

**Data dobel** — dedup `op_id` di backend belum jalan. Perbaiki di sana, bukan
di PWA.
