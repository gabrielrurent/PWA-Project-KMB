# MAR PROJEK KMB — aplikasi luring (PWA)

Antarmuka offline untuk mekanik yang mengerjakan **projek**. Seluruh logika —
poin, approval, payroll — ada di backend Apps Script, bukan di sini. PWA ini
hanya layar; ia tidak pernah menghitung uang sendiri.

## Identitas sistem ini

```
Web app    https://script.google.com/macros/s/AKfycbxh4086…/exec   (@2)
Script     1cKrVdmxH_hD4yVTwqLAXKdUjwM5wd7Glh4MdlpT7oP8KDOaGNgJCJVyh
Spreadsheet 1lnJo74OShElGEhBw3mgyl03orcr3q_LiK4kR6LwawyI
Cache      mar-projek-v1
IndexedDB  mar_projek_v1 (versi 1)
Warna      #4F633F (hijau zaitun) — KMB V2 memakai biru #2563EB
```

Kode backend-nya ada di `../MAR-PROJEK-KMB`. Panduan lengkap sistemnya ada di
`PANDUAN.html` di dalam project Apps Script itu.

## Asalnya, dan sembilan titik yang diganti

Disalin dari `../mar-offline-share` (cetakan bersih PWA KMB V2). Yang diganti:

| # | berkas | dari | jadi |
|---|---|---|---|
| 1 | `app.js` | `API_URL: ''` | `/exec` Projek KMB |
| 2 | `sw.js` | `API_URL = ''` | **URL yang sama persis** |
| 3 | `app.js` | `APP_VERSION = 'v89'` | `'projek-v1'` |
| 4 | `sw.js` | `CACHE = 'mar-v89'` | `'mar-projek-v1'` |
| 5 | `app.js:58` | regex `(mar-v\d+)` | `(mar-projek-v\d+)` |
| 6 | `app.js:143` | regex `^mar-(v\d+)$` | `^mar-(projek-v\d+)$` |
| 7 | `app.js` + `sw.js` | `indexedDB.open('mar_v2',2)` | `('mar_projek_v1',1)` |
| 8 | `manifest.json`, `index.html` | merek & warna KMB V2 | Projek KMB, zaitun |
| 9 | `sw.js` activate | hapus semua cache lain | hanya awalan `mar-projek-v` |

**Titik 1 dan 2 harus selalu sama persis.** Service worker tidak bisa membaca
variabel dari halaman, jadi URL-nya memang ditulis dua kali. Kalau berbeda,
halaman dan service worker bicara ke dua sistem berlainan — sebagian data masuk,
sebagian tidak, tanpa pola.

**Titik 5 dan 6 gagal dengan diam.** Keduanya membaca nomor versi dari nama
cache. Kalau regex tidak cocok dengan nama cache yang baru, tombol cek versi
berhenti bekerja dan HP terus memuat kode lama — tanpa satu pun pesan galat.
Ini gejala "perubahan tidak muncul di HP" yang tercatat di `SETUP.md`.

**Titik 9 bukan bawaan cetakan, melainkan perbaikan.** Aslinya `activate`
membuang SEMUA cache yang namanya bukan cache saat ini. Cache Storage dibagi
per-ORIGIN, bukan per-folder: kalau PWA ini dan PWA KMB V2 hidup di akun hosting
yang sama, yang satu akan menghapus aplikasi offline yang lain begitu aktif
sekali saja. Memberi nama berbeda tidak menolong — justru nama berbedalah yang
membuatnya ikut terhapus.

## Menaikkan versi saat merilis

Naikkan **keduanya**, selalu bersamaan:

```javascript
// app.js
var APP_VERSION = 'projek-v2';
// sw.js
var CACHE = 'mar-projek-v2';
```

Kalau hanya satu yang naik, peramban memuat kode baru di atas cache lama.

## Hosting

Berkas statis; hosting apa pun bisa. **Syarat mutlak: HTTPS** — service worker,
background sync, dan notifikasi tidak jalan di HTTP (`localhost` dikecualikan).

Kalau di-host satu akun dengan PWA MAR lain, titik 9 di atas yang menjaga
keduanya tidak saling menghapus.

## Cara orang masuk

```
https://<hosting>/index.html?token=<token orang itu>
```

Token dibuat di backend lewat `TokenAdmin.gs` (`createTokenForUser` atau
`generateMissingTokens`). Satu token dipakai untuk web app maupun PWA. Token
disimpan di IndexedDB, jadi cukup dibuka sekali.

## Memastikan sambungannya hidup

```bash
curl -sS -L -H "Content-Type: text/plain" \
  --data-binary '{"token":"UJI","action":"ping"}' \
  "https://script.google.com/macros/s/AKfycbxh4086…/exec"
```

Jawaban `{"success":false,"error":"Token tidak dikenal / nonaktif"}` berarti
**tersambung** — backend menerima POST `text/plain`, mem-parsing JSON, dan
memvalidasi token. Yang perlu dicurigai: halaman login Google (akses deployment
belum "Anyone") atau galat CORS (URL salah).

Catatan curl: jangan pakai `-X POST` bersama `-L`. Apps Script menjawab 302, dan
memaksa POST ke alamat redirect menghasilkan 405. Tanpa `-X POST`, curl beralih
ke GET di redirect — dan itulah yang mengembalikan JSON-nya.

`SETUP.md` berisi kontrak API lengkap dan daftar aksi.
