# Avonera48 — Video Pra-Show (Remotion)

Video waiting-screen 1920×1080 untuk streaming theater: loop pra-show 180 dtk, hitung mundur, dan layar standby.
Tanpa logo, tanpa nama setlist, tanpa data member. Semua animasi deterministik, audio dibuat dari nol (royalty-free).

| Composition | Durasi | Output akhir |
|---|---|---|
| `PreShowLoop` | 180 dtk, loop mulus | `out/preshow-loop.mp4` |
| `FinalCountdown` | `minutes × 60 + 4` dtk (default 5 menit) | `out/countdown-5m.mp4` |
| `Standby` | 30 dtk, loop mulus | `out/standby.mp4` |

## Persiapan

```bash
npm install
pip install edge-tts      # untuk voice over (opsional; tanpa ini render tetap jalan tanpa VO)
# ffmpeg & ffprobe wajib ada di PATH
```

## Ganti data show (tanggal / jam / venue)

Semua teks ada di **`src/config/show.config.ts`** — cukup edit lalu render ulang:

```ts
show: {
  date: "2026-10-18",   // YYYY-MM-DD → "Minggu, 18 Oktober 2026"
  time: "14:00",        // HH:mm (24 jam)
  timezone: "WIB",
  venue: "JKT48 Theater, fX Sudirman",
  greeting: "auto",     // "auto" | "pagi" | "siang" | "sore" | "malam"
},
```

- `greeting: "auto"` → sapaan dari jam: 04:00–10:59 pagi · 11:00–14:59 siang · 15:00–17:59 sore · 18:00–03:59 malam.
  Dipakai di judul opening ("SELAMAT SIANG") dan VO 1. Teks lain sengaja netral ("hari ini").
- `sponsors` / `socials` kosong → scene Partner / Connect di-skip, durasinya dialihkan ke Stage Interlude / Stay Tuned (total tetap 180 dtk).
- Logo partner taruh di `public/sponsors/` lalu isi `{ name, logo: "sponsors/nama.svg" }`.
- `streamUrl` dipakai untuk QR di scene Connect.
- Warna ada di `colors` (masih placeholder, lihat `// TODO`).

> Setelah mengubah `time`, `greeting`, atau `venue`, jalankan ulang `npm run audio` supaya VO 1 ikut berubah
> (`render:all` sudah melakukannya).

## Render

```bash
npm run render:all         # audio → loop → countdown → standby (+ mastering −14 LUFS)
npm run render:loop
npm run render:countdown   # 5 menit; ganti menit: lihat di bawah
npm run render:standby
npm run dev                # Remotion Studio untuk preview
```

Countdown dengan durasi lain:

```bash
npx remotion render src/index.ts FinalCountdown out/raw-countdown.mp4 --props='{"minutes":10}'
node scripts/master-audio.mjs countdown   # → out/countdown-10m.mp4
```

Cek still frame tertentu (1 bundle, 1 browser):

```bash
npm run stills -- PreShowLoop out/stills 0,600,1500,5399
```

Render lebih cepat di mesin dengan banyak core: tambahkan `--concurrency=8` pada perintah `remotion render`.

## Audio

`npm run audio` menjalankan:

| Script | Hasil |
|---|---|
| `scripts/gen-sfx.mjs` | 17 SFX WAV 48 kHz di `public/audio/sfx/` (riser, impact, whoosh, shimmer, tick 1–5, pop, swell, beep, final-hit, …), peak −3 dBFS |
| `scripts/gen-bgm.mjs` | BGM fallback procedural di `public/audio/bgm/generated/` — `loop.wav` 180 dtk, `standby.wav` 30 dtk, `countdown.wav` 60 dtk (lebih tegang). Semua loop sample-continuous |
| `scripts/gen-vo.mjs` | VO via edge-tts (`id-ID-GadisNeural`, cadangan `id-ID-ArdiNeural`, rate −5%) + naskah `.txt` |
| `scripts/build-manifest.mjs` | `public/audio/manifest.json`: file yang ada + durasi + loudness (dibaca composition) |

### Ganti BGM

Taruh file royalty-free milikmu di:

- `public/audio/bgm/bgm.mp3` → PreShowLoop
- `public/audio/bgm/bgm-standby.mp3` → Standby (opsional)
- `public/audio/bgm/bgm-countdown.mp3` → FinalCountdown (opsional)

Lalu `npm run manifest` (atau langsung render — manifest dibangun ulang otomatis). Loudness BGM diukur dan
diseimbangkan otomatis. Bila durasinya tidak tepat 180 dtk, titik loop di-crossfade 3 dtk sehingga tetap mulus.
**Jangan** pakai lagu JKT48/AKB48 resmi atau musik berhak cipta — stream bisa di-mute/takedown.

### Voice over manual

Bila edge-tts tidak bisa dipakai, rekam sendiri sesuai `public/audio/vo/vo1.txt`, `vo2.txt`, `vo3.txt`,
`vo-countdown.txt` dan simpan dengan nama yang sama (`vo1.mp3`, …). File audio hasil generate di-ignore git;
untuk menyimpan rekaman manual ke repo pakai `git add -f`.

### Mixing & mastering

- BGM −18 dB, di-duck ke −28 dB saat VO bicara (turun 8 frame, naik 15 frame); VO −6 dB; SFX −10 s/d −17 dB.
- Timing SFX/VO diambil dari `src/config/timeline.ts` yang sama dengan animasi.
- `scripts/master-audio.mjs`: two-pass loudnorm → −14 LUFS integrated, true peak ≤ −1 dBTP, AAC 320 kbps 48 kHz.
  Gain dibuat statis (linear) supaya loop tidak "memompa"; hasil ukur disimpan di `out/*.loudness.json`.

## Struktur

```
src/config/show.config.ts   data show (single source of truth)
src/config/greeting.ts      sapaan otomatis + format tanggal Indonesia
src/config/timeline.ts      timing scene, SFX, VO (dipakai visual & audio)
src/config/vo.ts            naskah VO
src/theme/                  warna, font (Unbounded + Plus Jakarta Sans), easing, helper animasi
src/compositions/           PreShowLoop, FinalCountdown, Standby
src/scenes/                 Opening, InfoShow, StageInterlude, Etiquette, Partner, Connect, StayTuned
src/components/             StageBackground (lampu, bokeh, grain), Curtain, Ticker, InfoChip, LiveBadge, QR, AudioBars, ikon SVG
src/transitions/            light-sweep, mask-slide, zoom-blur
src/audio/                  AudioBed (BGM + SFX + VO + ducking), manifest
scripts/                    generator audio, manifest, mastering, stills
```

## Catatan

- Font dimuat dari Google Fonts saat render (butuh internet).
- Bila Remotion tidak bisa mengunduh Chrome sendiri, arahkan ke Chromium lokal:
  `BROWSER_EXECUTABLE=/path/ke/chrome npm run render:all`.
