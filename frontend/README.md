# SpectArt Next.js migration v2

This version keeps the HTML/CSS layout as the visual source of truth.

## Routes

- `/` -> `app/page.tsx`
- `/guide` -> `app/guide/page.tsx`
- `/features` -> `app/features/page.tsx`
- `/studio` -> `app/studio/page.tsx`
- `/edit` -> `app/edit/page.tsx`
- `/my-art` -> `app/my-art/page.tsx`

## Components

- `Header`
- `Navigation`
- `ArtworkCard`
- `PreviewPanel`
- `ActionButtons`
- `LoginModal`
- `SignupModal`

## API connection points

Mock functions are isolated in `lib/api.ts`:

- `uploadAudio`
- `generateArtwork`
- `login`
- `saveArtwork`

Replace these functions when the backend APIs are ready.

## Design note

`background-wrap`, `shape`, `watercolorFilter`, and `noiseFilter` are preserved as layout-critical DOM/CSS layers. The guide/features left panel keeps the same direct-child order as the HTML version:

1. `background-wrap`
2. `main-wrap`
3. `svg`
