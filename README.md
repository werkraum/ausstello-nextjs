# ausstello für Next.js

Termine aus ausstello auf der eigenen Next.js-Seite: Liste mit Filtern, Teaser und Detailansicht. Gerendert wird im ausstello-Backend; das Paket holt je Seitenaufruf das fertige HTML samt SEO-Daten und trägt Titel, Canonical, Meta-Tags, JSON-LD und die Assets in die Seite ein.

## Voraussetzungen

Next.js 15 oder 16 mit App Router, React 19, Node 20 oder neuer. Getestet (Unit- und Browser-Tests) ist Next 16; Next 15 ist nur per Typecheck geprüft. Der Pages Router und die Option `cacheComponents` werden nicht unterstützt.

## Installation

Das Paket liegt nicht auf npm, sondern wird direkt aus GitHub installiert. Versionen sind Git-Tags (siehe `CHANGELOG.md`):

    npm install github:werkraum/ausstello-nextjs#v0.1.0

In der `package.json` steht danach:

    "@werkraum/ausstello-next": "github:werkraum/ausstello-nextjs#v0.1.0"

Importiert wird über den Paketnamen `@werkraum/ausstello-next`, nicht über den Namen des Repos.

npm klont das Repo beim Installieren und baut das Paket selbst (Skript `prepare`); dafür lädt es einmalig die Build-Werkzeuge (tsup, TypeScript) herunter. Auf dem Build-Server braucht es also Zugriff auf github.com und die npm-Registry. Ohne `#v…` wird der aktuelle Stand von `main` installiert – für Kundenprojekte immer einen Tag angeben, damit `package-lock.json` eine feste Version festhält.

Aktualisieren: Tag in der `package.json` ändern, dann `npm install`.

## Einstellungen

Umgebungsvariablen:

- `AUSSTELLO_BACKEND_URL` – Adresse des ausstello-Backends, z. B. `https://mein.ausstello.de` (Pflicht; fehlt sie, bricht der Build mit einer Meldung ab)
- `AUSSTELLO_TIMEOUT` – Zeitlimit je Abruf in Sekunden (Vorgabe 3). Eine Liste ohne Backend-Cache kann 1–3 Sekunden brauchen; läuft das Zeitlimit ab, sehen Besucher den `fallback`. Bei langsamem Backend 5 setzen.
- `AUSSTELLO_CACHE_MAX_LIFETIME` – höchstens so lange wird eine Antwort gehalten (Vorgabe 300, `0` schaltet den Cache ab)

Im ausstello-Backend unter Veröffentlichung → Integration müssen **Domain**, **Listen-URL** und **Detail-Präfix** genau zur Next-Seite passen. Bei Liste unter `/veranstaltungen` und Detail unter `/veranstaltungen/[segment]`: Listen-URL `/veranstaltungen`, Detail-Präfix `/veranstaltungen/`. Alle Links, Canonicals und die Sitemap baut das Backend aus diesen Werten.

## Einbindung

    // app/veranstaltungen/page.tsx
    import { AusstelloList, listMetadata, type SearchParams } from '@werkraum/ausstello-next';

    type Props = { searchParams: Promise<SearchParams> };

    export const generateMetadata = ({ searchParams }: Props) => listMetadata({ searchParams, basePath: '/veranstaltungen' });

    export default function Page({ searchParams }: Props) {
        return <AusstelloList searchParams={searchParams} basePath="/veranstaltungen" />;
    }

    // app/veranstaltungen/[segment]/page.tsx
    import { AusstelloDetail, detailMetadata } from '@werkraum/ausstello-next';

    type Props = { params: Promise<{ segment: string }> };

    export const generateMetadata = async ({ params }: Props) =>
        detailMetadata({ segment: (await params).segment, basePath: '/veranstaltungen' });

    export default async function Page({ params }: Props) {
        return <AusstelloDetail segment={(await params).segment} basePath="/veranstaltungen" />;
    }

    // app/sitemap.ts
    export { sitemapEntries as default } from '@werkraum/ausstello-next';

Teaser, z. B. auf der Startseite: `<AusstelloTeaser basePath="/veranstaltungen" perPage={3} />`. Weitere Props: `preset` (feste Vorauswahl nach `locations`, `tags`, `primary_category`, `secondary_category`), `perPage`, `filterbar={false}` (nur Liste), `fallback` (wird gezeigt, wenn das Backend nicht erreichbar ist), `nonce` (bei CSP mit Nonce).

`basePath` ist der Pfad der Seite mit der Liste. Unbekannte Termine beantwortet `AusstelloDetail` mit `notFound()`.

## Titel, Beschreibung und Open Graph

Das Backend liefert für die **Liste** keinen Titel und keine Beschreibung, nur Canonical, robots (`noindex` auf Filter-URLs) und Blätter-Links. Ohne eigene Angaben erbt die Liste Titel und Beschreibung aus dem Layout – meist die der Startseite. Eigene Werte setzen und die ausstello-Angaben darüberlegen:

    export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => ({
        title: 'Veranstaltungen',
        description: 'Alle Termine …',
        ...(await listMetadata({ searchParams, basePath: '/veranstaltungen' })),
    });

Die **Detailseite** liefert Titel, Beschreibung, Canonical, Open Graph (Bild 1200×630), Twitter und JSON-LD. Hängt das Backend keinen Titel-Zusatz an, greift das `title.template` des Layouts.

Next führt Metadata nur flach zusammen: Das `openGraph` der Detailseite ersetzt das des Layouts vollständig, `siteName` und `locale` fehlen dann. Wieder dazumischen:

    export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
        const meta = await detailMetadata({ segment: (await params).segment, basePath: '/veranstaltungen' });
        return { ...meta, openGraph: { siteName: 'Meine Seite', locale: 'de_DE', ...meta.openGraph } };
    };

## Auswirkungen auf die Seite

- Besucherparameter `filter[...]` und `page` gehen unverändert ans Backend; andere Parameter nicht.
- Antworten liegen im Next-Data-Cache (Tag `ausstello`, auch als Export `CACHE_TAG` für `revalidateTag`), höchstens 60 Sekunden bzw. `AUSSTELLO_CACHE_MAX_LIFETIME`; die Sitemap bis zu 3600 Sekunden (ebenfalls durch `AUSSTELLO_CACHE_MAX_LIFETIME` gedeckelt). Sofort leeren: `revalidateTag('ausstello')`. Ist das Backend nicht erreichbar, liefert Next die zuletzt gespeicherte Antwort weiter.
- Seiten mit ausstello-Komponenten (und die Sitemap) rendert Next immer dynamisch (`connection()`); die Antworten kommen trotzdem aus dem Data-Cache. So bleibt bei einem Ausfall die letzte gute Antwort erhalten, statt dass eine statisch gecachte Seite den Fallback festschreibt.
- `generateMetadata`-Helfer und Komponente müssen dieselben Optionen bekommen (`basePath`, `perPage`, `preset`, …), damit beide dieselbe Anfrage teilen.
- Weiche Navigation: Das Output-JS reagiert auf `ausstello:scan` (neues HTML einlesen) und `ausstello:leave` (beim Verlassen: offenes Filtermodal schließen, Scroll-Sperre lösen).
- Filter-URLs sind `noindex` und verweisen per Canonical auf die ungefilterte Liste.
- Seiten mit ausstello-Komponenten werden über `connection()` dynamisch – aber erst, wenn das Rendern die Komponente erreicht. Fragt das Layout beim Build eine Datenbank ab, die es dort nicht gibt, scheitert das Vorrendern vorher. Dann wie bei den übrigen Routen `export const dynamic = 'force-dynamic'` setzen.

## Datenschutz und CSP

Besucher laden Stylesheets, Skripte, Bilder und Schriften direkt vom ausstello-Backend und schicken Anmeldungen dorthin. `cspSources()` liefert den Origin des Backends; er gehört in `script-src`, `style-src`, `img-src`, `font-src` und `connect-src`. Die Einbindung gehört in die Datenschutzerklärung – und in den Text eines Cookie- oder Consent-Banners, wenn der aufzählt, welche externen Inhalte die Seite lädt.

## Entwicklung

Dieses Repo ist ein Spiegel. Entwickelt wird im ausstello-Hauptrepo unter `integrations/nextjs`; dort laufen auch die Tests in der CI. Änderungen hier bitte als Issue melden, nicht als Pull Request.

Die Testinstanz braucht das Backend aus dem Hauptrepo. Frische Einrichtung in `integrations/nextjs`:

1. `printf 'y\n' | ddev start` (das Backend-DDEV `ausstello.de` muss laufen)
2. `ddev seed`
3. `ddev setup -f && ddev restart`

Die Reihenfolge zählt: Der erste Build läuft vor dem Seeden und würde sonst die alte Domain in die statischen Seiten backen.

Nach Änderungen am Paket: `ddev setup -f && ddev restart`.

Zurück zur TYPO3-Instanz: im Backend-DDEV `ddev console backend:integration:target https://ausstello-typo3-ext.ddev.site /veranstaltungen /veranstaltungen/detail/`.

Unit-Tests: `npm test`.

Browser-Tests:

    npm --prefix .instance/e2e install
    npx --prefix .instance/e2e playwright install chromium
    npm --prefix .instance/e2e test

Sie brauchen `mkcert` im PATH (das Testskript vertraut dem DDEV-Zertifikat über `mkcert -CAROOT`) und eine POSIX-Shell.

Veröffentlichen (im Hauptrepo):

1. Version in `package.json` und `CHANGELOG.md` setzen, committen.
2. `bin/nextjs-mirror --tag` – spiegelt `integrations/nextjs` nach `main` auf GitHub und setzt den Tag `v<version>` aus der `package.json`. Ohne `--tag` wird nur `main` aktualisiert.

Ein Release über npm ist nicht vorgesehen; `"private": true` verhindert ein versehentliches `npm publish`.
