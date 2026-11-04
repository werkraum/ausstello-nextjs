# Changelog

## Unveröffentlicht

- `preset` kennt Ausschlüsse: `exclude_locations`, `exclude_tags`, `exclude_primary_category`, `exclude_secondary_category` (braucht ein ausstello-Backend mit Ausschluss-Preset).
- Veraltete Antworten aus dem Next-Data-Cache werden sofort frisch geholt statt einmal ausgeliefert (behebt ungestylte Seiten nach einem Backend-Deploy). Wirkt mit Backends, die `cache.generatedAt` liefern; ältere Backends verhalten sich wie bisher.

## 0.1.0

- Erste Version: `AusstelloList`, `AusstelloTeaser`, `AusstelloDetail`, `listMetadata`, `detailMetadata`, `sitemapEntries`, `cspSources` für den App Router (Envelope v2).
