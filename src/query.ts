export type SearchParams = Record<string, string | string[] | undefined>;

export type Preset = Partial<Record<'locations' | 'tags' | 'primary_category' | 'secondary_category', number[]>>;

export type ListOptions = {
    /** Pfad der Next-Seite mit der Liste, z. B. /veranstaltungen */
    basePath: string;
    preset?: Preset;
    perPage?: number;
    filterbar?: boolean;
};

const SEGMENT = /^[A-Za-z0-9-]{1,200}$/;

/**
 * Nur page und filter[...] gehen durch: alles andere aus der Besucher-URL (utm_*,
 * ein fremdes base) hat beim Backend nichts zu suchen. Sortiert, damit dieselbe
 * Liste unabhängig von der Parameterreihenfolge denselben Cache-Eintrag trifft.
 */
export function listQuery(view: 'list' | 'teaser', options: ListOptions, searchParams: SearchParams = {}): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
        if (key !== 'page' && !key.startsWith('filter[')) {
            continue;
        }
        for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
            query.append(key, item);
        }
    }
    query.set('base', options.basePath);
    if (view === 'teaser') {
        query.set('view', 'teaser');
    }
    for (const [key, ids] of Object.entries(options.preset ?? {})) {
        for (const id of ids ?? []) {
            query.append(`preset[${key}][]`, String(id));
        }
    }
    if (options.perPage !== undefined) {
        query.set('perPage', String(options.perPage));
    }
    if (options.filterbar === false) {
        query.set('filterbar', '0');
    }
    query.sort();

    return query.toString();
}

export function detailQuery(basePath: string): string {
    return new URLSearchParams({ base: basePath }).toString();
}

export function isValidSegment(segment: string): boolean {
    return SEGMENT.test(segment);
}
