# Data Sources

This file tracks any external astronomy data used by the standalone demo.

## Current state

The visual base uses local copies of the existing portfolio assets:

- `public/star-sea-poster.webp` is copied from `czxwebsite/public/hero-poster.webp`.
- `public/star-sea.webm` is copied from `czxwebsite/public/hero.webm`.

The WebGL layer is intentionally transparent and additive so the dynamic version preserves the original image/video composition.

## Planned catalog requirements

- Keep the browser payload small enough for the initial interactive chunk.
- Store only the fields needed by the renderer: stable identifier, right ascension, declination, magnitude, optional color index, and constellation id.
- Track the exact source version, license, attribution text, and filtering script before committing catalog data.
- Keep constellation line definitions separate from star records so the renderer can highlight a selected constellation without rebuilding the star buffer.
