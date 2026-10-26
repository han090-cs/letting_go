# Letting Go

[![Deploy](https://github.com/han090-cs/letting-go/actions/workflows/deploy.yml/badge.svg)](https://github.com/han090-cs/letting-go/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A private, ephemeral, offline-first web app for writing down what feels heavy and watching it burn, drift or blow away. **Nothing you write is saved, sent or tracked.**

🌐 English · မြန်မာ · 日本語 · 中文 · العربية · Español · Français · 한국어

## Features

- **Three ways to release**: burn to ash, ocean tide, or blow with the wind
- **Wish lanterns**: write a wish and float a silent lantern into the night sky (never stored). Direct link: `/#lantern`
- **Evidence-informed flow**: expressive writing, affect labelling, symbolic disposal, optional before/after weight check, and a 4-in / 6-out breathing guide
- **Burmese done properly**: bundled Noto Sans Myanmar (no CDN), syllable-level text splitting, Zawgyi detection, naturally written copy
- **Local-only crisis keyword check** with links to support (runs on the device, nothing is transmitted)
- **Installable PWA** with full offline pre-cache; a service worker that versions itself on every build
- Automatic dark mode, keyboard and screen-reader support, works on phones, tablets and desktops

## Getting started

Requires Node.js 20.19 or newer.

```bash
npm ci
npm run dev        # develop at http://localhost:5173
npm test           # unit tests (text splitting, crisis check, Zawgyi detection)
npm run build      # type-check + production build in dist/
npm run check      # all of the above
```

## Project layout

```
src/
  main.ts          app logic, canvas effects, UI
  styles.css       styling (light/dark, RTL aware)
  i18n/            index.ts (copy + language list), my.ts (Burmese)
  lib/text.ts      chunking, Burmese syllables, Zawgyi + crisis detection
  lib/text.test.ts unit tests
public/            manifest, icons
vite.config.ts     build config + offline service-worker generator
```

## Deploy to GitHub Pages

1. Push to `main`.
2. In the repository go to **Settings → Pages → Source** and choose **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes the site.

The build uses a relative base (`./`), so it works at `https://<user>.github.io/<repo>/` and on a custom domain without changes.

## Built to need no maintenance

Exact dependency versions plus a lockfile, `npm ci` in CI, zero runtime network dependencies, and a hash-versioned service worker.

## Privacy

Nothing you write leaves the device. Only your language choice is remembered locally. This is a reflective tool, not medical care or an emergency service. If you are in crisis, please contact a local helpline (for example [findahelpline.com](https://findahelpline.com)) or someone you trust.

## မြန်မာ

ဝန်လေးနေတာတွေကို ရေးချပြီး မီးရှို့ခြင်း၊ ပင်လယ်ရေလှိုင်းနဲ့ ပါသွားစေခြင်း၊ လေနဲ့အတူ လွင့်စေခြင်းတို့ဖြင့် လွှတ်ပေးနိုင်တဲ့ ကိုယ်ရေးကိုယ်တာလုံခြုံပြီး အင်တာနက်မလိုတဲ့ web app ဖြစ်ပါတယ်။ **ရေးသမျှကို သိမ်းဆည်းခြင်း၊ ပို့ခြင်း၊ ခြေရာခံခြင်း မရှိပါဘူး။**

## Contributing · License

See [CONTRIBUTING.md](CONTRIBUTING.md). Released under the [MIT License](LICENSE). Created by [han090-cs](https://github.com/han090-cs).
