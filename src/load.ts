import 'server-only';
import { cache } from 'react';
import { fetchEnvelope } from './client';
import { readConfig } from './config';
import type { Outcome } from './envelope';
import { detailQuery, isValidSegment, listQuery, type ListOptions, type SearchParams } from './query';

export type Awaitable<T> = T | Promise<T>;

/**
 * Ein Abruf je Seitenaufruf: generateMetadata und die Komponente landen mit
 * denselben (primitiven) Argumenten hier und teilen sich das Ergebnis.
 */
const load = cache((path: string, query: string): Promise<Outcome> => fetchEnvelope(readConfig(), path, query));

export async function loadList(options: ListOptions, searchParams?: Awaitable<SearchParams>): Promise<Outcome> {
    return load('liste', listQuery('list', options, (await searchParams) ?? {}));
}

export async function loadTeaser(options: Omit<ListOptions, 'filterbar'>): Promise<Outcome> {
    return load('liste', listQuery('teaser', options));
}

export async function loadDetail(segment: string, basePath: string): Promise<Outcome> {
    if (!isValidSegment(segment)) {
        return { kind: 'notFound' };
    }
    return load(`termin/${segment}`, detailQuery(basePath));
}
