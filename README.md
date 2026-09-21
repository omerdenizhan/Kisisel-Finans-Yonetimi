# Kişisel Finans Yönetimi

Bu proje, tek kullanıcıya özel çalışacak şekilde tasarlanmış yerel bir kişisel finans takip uygulamasıdır. React + TypeScript frontend, Express + SQLite backend ve güçlü bir bütçe / tahsilat / taksit / rapor akışı sunar.

Modern UI, dark mode, glassmorphism görünüm, güvenli oturum yönetimi ve yerel veritabanı desteğiyle geliştirilmiştir. Uygulama hem kişisel kullanım hem de hızlı prototip/yerel demo amaçlı uygundur.

![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Vite](https://img.shields.io/badge/Vite-5-646CFF) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8) ![Node](https://img.shields.io/badge/Node-20-339933) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57)

---

## Proje Hakkında

Uygulama, aşağıdaki iş akışlarını tek bir yerel arayüzde yönetmeyi hedefler:

- Gelir ve gider takibi
- Aylık bütçe kontrolü
- Taksit yönetimi
- Tekrarlayan işlemler
- Hedef birikimi takibi
- Ödemeler ve hatırlatıcılar
- Rapor ve dışa aktarma
- Veritabanı yedekleme / geri yükleme

Yapılandırma olarak tek kullanıcı, tek veritabanı ve yerel oturum modeli kullanılır. Server tarafı lokal SQLite üzerinde çalışır; frontend ise Vite üzerinden geliştirilmektedir.

---

## Temel Özellikler

### 1. Dashboard

- Mevcut ay gelir, gider ve net değer kartları
- Aylık toplam görünümü
- Son işlemler listesi
- Yaklaşılan taksitler ve hatırlatıcılar
- Recharts ile gelir/gider ve kategori görselleri
- Mobil ve masaüstü uyumlu düzen

### 2. İşlem Yönetimi

- Gelir ve gider kayıtları
- Kategori bazlı ayrım
- Tarih, tutar, arama ve filtreleme desteği
- İşlemlerin düzenlenmesi ve silinmesi
- Net toplam hesaplama

### 3. Taksit Sistemi

- Birden fazla taksitin aylık plan otomasyonu
- Toplam tutar ve taksit sayısı ile otomatik ödeme takvimi üretimi
- Ödeme / ödeme geri alma akışı
- Taksit ödeme durumları
- Son tarih geçmiş ödeme işaretleme

### 4. Tekrarlayan İşlemler

- Günlük, haftalık, aylık ve yıllık tekrarlar
- Otomatik oluşan işlemler
- Manuel çalıştırma düğmesi
- Bitiş tarihi ve pasifleştirme desteği

### 5. Bütçeler

- Kategori bazlı aylık bütçe takibi
- Harcanan / kalan / kullanım yüzdesi
- Aşım görünümü ve uyarı durumu

### 6. Hedefler

- Hedef tutar ve mevcut birikim takibi
- İlerleme yüzdesi
- Hedef tarihi ve tamamlanma durumu

### 7. Hatırlatıcılar

- Faturalar, görevler ve ödemeler için listeleme
- Tamamlandı / gecikmiş işaretleme
- Tarih bazlı görünüm

### 8. Raporlar

- Aylık raporlar
- Yıllık raporlar
- Kategori bazlı dağılım
- Gelir-gider karşılaştırması

### 9. Dışa Aktarma

- PDF export
- Excel export
- Rapor ve işlem sayfaları için dosya çıktısı

### 10. Ayarlar ve Yönetim

- Kategori ekleme, düzenleme ve arşivleme
- Tema değiştirme (aydınlık / karanlık)
- Veritabanı yedeği indir
- Veritabanı geri yükleme
- Güvenli oturum desteği

---

## Teknoloji Yığını

| Katman | Teknoloji |
| --- | --- |
| Frontend | React 18, TypeScript |
| UI | Tailwind CSS, custom theme tokens |
| Build | Vite |
| State | Zustand, TanStack Query |
| Routing | React Router DOM |
| Grafikler | Recharts |
| Animasyon | Framer Motion |
| Backend | Node.js 20, Express |
| Veritabanı | SQLite (better-sqlite3) |
| Validasyon | Zod |
| PDF | PDFKit |
| Excel | ExcelJS |
| Tarih işlemleri | date-fns |

---

## Proje Yapısı

```text
KisiselFinans/
├── package.json                  # kök scriptler, concurrently
├── tsconfig.base.json
├── client/                       # React uygulaması
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── public/
│   └── src/
│       ├── App.tsx
│       ├── api/
│       ├── components/
│       ├── lib/
│       ├── pages/
│       ├── stores/
│       ├── styles/
│       ├── types/
│       └── main.tsx
├── server/                      # Express + SQLite API
│   ├── package.json
│   ├── tsconfig.json
│   ├── scripts/
│   ├── data/
│   └── src/
│       ├── index.ts
│       ├── db/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── ...
└── README.md
```

Ana başlıklar şunlardır:

- `client/src/pages`: uygulama ekranları
- `client/src/components`: görünüm, grafik, layout, ui bileşenleri
- `client/src/stores`: tema ve auth state
- `server/src/routes`: API endpointleri
- `server/src/services`: iş mantığı ve hesaplamalar
- `server/src/db`: veritabanı bağlantısı, şema, seed, migrasyon

---

## Çalıştırma Ön Koşulları

Geliştirme ortamı için minimum gereksinim:

- Node.js 20+
- npm
- Windows/macOS/Linux

Sunucu tarafında `better-sqlite3` derlemesi yapıldığı için yerel sistemde C++ derleyici veya uygun build araçları mevcut olmalıdır. Windows üzerinde çoğu durumda Node 20 + Visual Studio Build Tools veya benzeri araçlar yeterlidir.

---

## Kurulum

Kök dizinde aşağıdaki komutları çalıştırın:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Alternatif olarak tek komutla:

```bash
npm run install:all
```

---

## Geliştirme Modunda Çalıştırma

Kök dizinde:

```bash
npm run dev
```

Bu komut iki tarafı birden başlatır:

- frontend: Vite dev server
- backend: Express API server

Varsayılan adresler:

- Frontend: http://localhost:5173
- API: http://localhost:3000

---

## Üretim Build

```bash
npm run build
```

Bu komut:

- client tarafı build edilir
- server tarafı TypeScript derlenir
- public statik kaynaklar uygun yere kopyalanır

Sonrasında çalıştırmak için:

```bash
npm start
```

Uygulama, backend üzerinde hem API hem de SPA sunumunu aynı anda servis eder.

---

## Varsayılan Hesap Bilgileri

Uygulama ilk çalıştırmada otomatik olarak bir yönetici kullanıcısı oluşturur:

- e-posta: `admin@admin.com`
- parola: `12345678`

Bu bilgiler `server/src/db/seed.ts` içinde tanımlanmıştır. Geliştirme ortamında güvenlik için sonra değiştirilmesi önerilir.

---

## Ortam Değişkenleri

Proje doğrudan `.env` dosyası kullanmaz; bazı ayarlar `process.env` üzerinden okunur. Örnek kullanım:

```bash
PORT=3000
DB_PATH=./data/finance.db
NODE_ENV=development
```

`DB_PATH` belirtilmezse veritabanı varsayılan olarak şuraya yazılır:

```text
server/data/finance.db
```

---

## API Genel Bakış

API rotaları `/api` altında gelir. Bazı ana uç noktalar şunlardır:

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| GET | `/api/health` | sağlık kontrolü |
| POST | `/api/auth/login` | giriş yap |
| GET | `/api/auth/me` | mevcut kullanıcının bilgisi |
| POST | `/api/auth/logout` | çıkış yap |
| PUT | `/api/auth/profile` | profil güncelle |
| PUT | `/api/auth/change-password` | parola değiştir |
| GET | `/api/dashboard` | dashboard verisi |
| GET/POST/PATCH/DELETE | `/api/transactions` | işlemler |
| GET/POST/PATCH/DELETE | `/api/categories` | kategoriler |
| GET/POST/PATCH/DELETE | `/api/installments` | taksitler |
| GET/POST/PATCH/DELETE | `/api/recurring` | tekrarlayan işlemler |
| GET/POST/PATCH/DELETE | `/api/budgets` | bütçeler |
| GET/POST/PATCH/DELETE | `/api/goals` | hedefler |
| GET/POST/PATCH/DELETE | `/api/reminders` | hatırlatıcılar |
| GET | `/api/reports/monthly` | aylık rapor |
| GET | `/api/reports/yearly` | yıllık rapor |
| GET/PATCH | `/api/settings` | ayarlar |
| GET | `/api/settings/backup` | veritabanı yedek indir |
| POST | `/api/settings/restore` | veritabanı geri yükle |
| GET | `/api/export/...` | pdf/xlsx dışa aktarma |

Önemli not: tüm korumalı rotalar `requireAuth` middleware ile korunur. Client tarafında token `localStorage` içinde saklanır.

---

## Veritabanı Yapısı

SQLite veritabanı, `server/src/db/schema.sql` üzerinde tanımlıdır. Ana tablolar şunlardır:

- `categories`
- `transactions`
- `installments`
- `installment_payments`
- `recurring_transactions`
- `budgets`
- `goals`
- `reminders`
- `settings`
- `users`
- `sessions`
- `_migrations`

Veritabanı bağlantısı `server/src/db/connection.ts` içinde tek bir singleton şekilde tutulur. WAL modu açılır ve foreign keys etkinleştirilir.

---

## Güvenlik ve Kimlik Doğrulama

Uygulama, belirli bir kullanıcıya özel yerel oturum modeli kullanır:

- kullanıcılar `users` tablosunda saklanır
- parola `hashPassword` ile özetlenir
- oturumlar `sessions` tablosunda tutulur
- her istek `Authorization: Bearer <token>` ile doğrulanır
- token süresi 30 gündür

Bu yapı, tek kullanıcı ve yerel kullanım için uygun bir güvenlik yaklaşımıdır.

---

## UI ve Tasarım Notları

- glassmorphism benzeri kartlar ve arka plan efekti
- karanlık / aydınlık tema
- responsive tasarım
- mobile drawer ve desktop sidebar düzeni
- lucide-react ikonları
- Recharts grafikler ve Framer Motion animasyonlar

---

## Örnek Geliştirme Akışı

1. `npm run dev` ile uygulamayı başlat
2. `admin@admin.com` ile giriş yap
3. kategorileri yönet
4. gelir/gider işlemleri ekle
5. bütçeleri oluştur
6. taksitleri planla
7. tekrarlayan işlemleri ayarla
8. raporları kontrol et
9. yedek alma / geri yükleme işlemlerini kullan

---

## Sorun Giderme

### `better-sqlite3` derleme hatası

Node sürümüne göre uygun derleyici / build araçları kurulu olmalıdır. Windows için Visual Studio C++ araçları veya benzeri gereksinimler kontrol edilmelidir.

### Veritabanı oluşmuyor

Server tarafında ilk çalıştırma sırasında `runMigrations()` ve `runSeed()` çalışır. `server/data` klasörü güvenli şekilde oluşturulur.

### Port çakışması

`PORT` değişkeni kullanılarak farklı bir port seçilebilir:

```bash
PORT=4000 npm run dev
```

### Uygulama yüklenmiyor

Aşağıdaki komutları sırayla kontrol edin:

```bash
npm --prefix client run build
npm --prefix server run build
```

---

## Geliştirme Notları

- Frontend tarafında lazy loading uygulanmıştır.
- Üretim build sonrası API static frontend sunabilir.
- Birden fazla sayfa tek istekle yüklenecek şekilde code splitting kullanılmıştır.
- Veritabanı işlemleri doğrudan SQLite üzerine yazılır; çevrimiçi servis gerektirmez.

---

## Lisans

Bu proje için özel kullanım ve geliştirme amaçlı lisans uygulanmaktadır. Daha net bir lisans gereksinimi varsa repository sahibi tarafından belirtilebilir.

---

## Kısa Özet

Bu uygulama, kişisel finans yönetimini tek bir yerel sistem üzerinden yönetmek için tasarlanmıştır. Kullanıcılar gelir-gider, bütçe, taksit, hedef, hatırlatıcı ve rapor akışlarını tek arayüzden yönetebilir. SQLite ile hafif ve hızlı çalışan arka plan, React ile modern bir kullanıcı deneyimi sunar.
