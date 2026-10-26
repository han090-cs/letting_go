# Contributing

Thanks for helping. This app is meant to stay small, quiet and private.

```bash
npm ci
npm run dev      # local development
npm run check    # tests + type-check + production build
```

Ground rules:

1. **Privacy first.** No analytics, no remote fonts or scripts, no storage of what the user writes. The only thing remembered locally is the language choice.
2. **Pin dependencies** to exact versions and commit `package-lock.json`.
3. **Add tests** in `src/lib/text.test.ts` for any change to text splitting, crisis detection or Zawgyi detection.
4. **Translations** live in `src/i18n/`. Burmese is in `my.ts`; languages without a key fall back to English.
