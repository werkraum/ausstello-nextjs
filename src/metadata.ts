import 'server-only';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { toMetadata } from './head';
import { type Awaitable, loadDetail, loadList } from './load';
import type { ListOptions, SearchParams } from './query';

export async function listMetadata({ searchParams, backendUrl, ...options }: ListOptions & { searchParams?: Awaitable<SearchParams>; backendUrl?: string }): Promise<Metadata> {
    await connection();
    const outcome = await loadList(options, searchParams, backendUrl);
    return outcome.kind === 'ok' ? toMetadata(outcome.envelope.head) : {};
}

export async function detailMetadata({ segment, basePath, backendUrl }: { segment: string; basePath: string; backendUrl?: string }): Promise<Metadata> {
    await connection();
    const outcome = await loadDetail(segment, basePath, backendUrl);
    if (outcome.kind === 'notFound') {
        notFound();
    }
    return outcome.kind === 'ok' ? toMetadata(outcome.envelope.head) : {};
}
