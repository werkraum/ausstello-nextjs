import 'server-only';
import { cache } from 'react';
import { fetchEnvelope } from './client';
import { readConfig } from './config';
import type { Outcome } from './envelope';
import { detailQuery, isValidSegment, listQuery, type ListOptions, type SearchParams } from './query';

export type Awaitable<T> = T | Promise<T>;

/**
 * Ein Abruf je Seitenaufruf: generateMetadata und die Komponente landen mit
 * denselben (primitiven) Argumenten hier und teilen sich das Ergebnis. Das Backend
 * gehört zum Schlüssel, normalisiert (ohne Schrägstrich am Ende).
 */
const load = cache((backendUrl: string, path: string, query: string): Promise<Outcome> =>
    fetchEnvelope(readConfig(process.env, backendUrl), path, query),
);

const backend = (backendUrl?: string): string => readConfig(process.env, backendUrl).backendUrl;

export async function loadList(options: ListOptions, searchParams?: Awaitable<SearchParams>, backendUrl?: string): Promise<Outcome> {
    return load(backend(backendUrl), 'liste', listQuery('list', options, (await searchParams) ?? {}));
}

export async function loadTeaser(options: Omit<ListOptions, 'filterbar'>, backendUrl?: string): Promise<Outcome> {
    return load(backend(backendUrl), 'liste', listQuery('teaser', options));
}

export async function loadDetail(segment: string, basePath: string, backendUrl?: string): Promise<Outcome> {
    const url = backend(backendUrl);
    if (!isValidSegment(segment)) {
        return { kind: 'notFound' };
    }
    return load(url, `termin/${segment}`, detailQuery(basePath));
}
