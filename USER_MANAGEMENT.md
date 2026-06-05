# Panduan Menambah User Baru (Email Login)

Karena aplikasi ini tidak menggunakan *database* untuk *user* (untuk menjaga sistem tetap ringan dan *maintenance-free*), daftar *user* yang diizinkan untuk login menggunakan email (non-Microsoft) ditulis secara *hardcode* di dalam file `auth.ts`.

Demi alasan keamanan, sistem **tidak menyimpan password asli**. Sistem hanya menyimpan versi acak (*Hash SHA-256*) dari kata sandi tersebut.

Berikut adalah langkah-langkah untuk menambah *user* baru:

## Langkah 1: Buat Password dan Hasilkan Hash SHA-256

Kamu harus mengubah *password* asli pengguna menjadi *Hash SHA-256* sebelum memasukkannya ke dalam kode.

### Cara A: Menggunakan Generator Online (Paling Mudah)
1. Buka browser dan pergi ke website seperti: https://emn178.github.io/online-tools/sha256.html
2. Ketik password yang diinginkan (misal: `BudiAnakAsiasistem!`) ke dalam kotak input.
3. *Copy* hasil rentetan teks panjang dari kotak output (contoh hasil: `7f1b...`).

### Cara B: Menggunakan Terminal (Mac/Linux)
Jika kamu sedang berada di terminal server, kamu bisa mengetikkan perintah ini:
```bash
echo -n "PasswordBaru123!" | shasum -a 256
```
Salin *hash* panjang yang muncul sebelum tanda spasi/strip.

---

## Langkah 2: Tambahkan ke File `auth.ts`

Buka file `/auth.ts` di *code editor* kamu.

Cari bagian kode `const STATIC_USERS = [ ... ]` (sekitar baris ke-15).
Tambahkan baris baru dengan struktur berikut:

```typescript
{ 
  id: "5", // Urutan ID bebas yang penting unik
  email: "email_baru@domain.com", 
  hash: "paste_hash_sha256_yang_baru_saja_kamu_copy_disini", 
  name: "Nama Lengkap" 
},
```

### Contoh Hasil Akhir:
```typescript
const STATIC_USERS = [
  { id: "1", email: "divakhaliza@gmail.com", hash: "502cd...", name: "Diva Khaliza" },
  { id: "2", email: "fenti...prima@gmail.com", hash: "85f41...", name: "Fenti" },
  // ...
  { id: "5", email: "budi@asiasistem.com", hash: "7f1b...", name: "Budi Santoso" }, // <- USER BARU
]
```

## Langkah 3: Restart Server

Setelah menyimpan file `auth.ts`, pastikan kamu me-*restart* server Next.js kamu agar perubahan terbaca!

- **Di lokal:** Tidak perlu restart, Next.js akan memuat ulang secara otomatis (*Hot Reload*).
- **Di Production (Server Linux):** Jalankan perintah `npm run build && pm2 restart asisgrab-frontend`

Selesai! User baru sekarang dapat *login* menggunakan alamat email mereka dan *password* asli (bukan *hash*) yang kamu berikan kepada mereka.
