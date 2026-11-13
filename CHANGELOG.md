# Changelog

## 0.3.0

- Mehrere ausstello-Instanzen auf einer Website: `backendUrl` an `AusstelloList`, `AusstelloTeaser`, `AusstelloDetail`, `listMetadata`, `detailMetadata` und `sitemapEntries({ backendUrl })` übersteuert `AUSSTELLO_BACKEND_URL` (die bleibt Pflicht). Abrufe und Cache sind je Backend getrennt.
- Stilvariablen je Instanz: Backends mit `assets.instance` im Envelope bekommen eigene Stilvariablen, zwei Instanzen behalten auf derselben Seite ihre Farben und Schriften. Ältere Backends verhalten sich wie bisher.
- Schalter `styles`, `scripts`, `settings` an den Komponenten (Vorgabe `true`) blenden Stylesheets, Output-JS oder Stilvariablen aus.
- `cacheTag(backendUrl)` liefert den Cache-Tag eines Backends (`ausstello:<host>`); `revalidateTag('ausstello')` leert weiterhin alles.
- `cspSources(...backendUrls)` liefert die Origins aller Backends.

## 0.2.0

- `preset` kennt Ausschlüsse: `exclude_locations`, `exclude_tags`, `exclude_primary_category`, `exclude_secondary_category` (braucht ein ausstello-Backend mit Ausschluss-Preset).
- Entwickelt und getestet mit Next.js 16.4.5. Next.js 16.0.0 bis 16.4.0 hat kritische Sicherheitslücken (u. a. GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr): Seiten, die das Paket einbinden, auf mindestens 16.4.5 aktualisieren.
- Veraltete Antworten aus dem Next-Data-Cache werden sofort frisch geholt statt einmal ausgeliefert (behebt ungestylte Seiten nach einem Backend-Deploy). Wirkt mit Backends, die `cache.generatedAt` liefern; ältere Backends verhalten sich wie bisher.

## 0.1.0

- Erste Version: `AusstelloList`, `AusstelloTeaser`, `AusstelloDetail`, `listMetadata`, `detailMetadata`, `sitemapEntries`, `cspSources` für den App Router (Envelope v2).
