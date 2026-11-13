import 'server-only';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import type { Outcome } from './envelope';
import { Fragment } from './Fragment';
import { type Awaitable, loadDetail, loadList, loadTeaser } from './load';
import type { ListOptions, SearchParams } from './query';

type Common = {
    fallback?: ReactNode;
    nonce?: string;
    /** Anderes ausstello-Backend als AUSSTELLO_BACKEND_URL für diese Komponente. */
    backendUrl?: string;
};

export type ListProps = ListOptions & Common & { searchParams?: Awaitable<SearchParams> };
export type TeaserProps = Omit<ListOptions, 'filterbar'> & Common;
export type DetailProps = { segment: string; basePath: string } & Common;

function render(outcome: Outcome, { fallback, nonce }: Common) {
    if (outcome.kind === 'ok') {
        return <Fragment envelope={outcome.envelope} nonce={nonce} />;
    }
    return <>{outcome.kind === 'unavailable' ? fallback ?? null : null}</>;
}

export async function AusstelloList({ searchParams, fallback, nonce, backendUrl, ...options }: ListProps) {
    await connection();
    return render(await loadList(options, searchParams, backendUrl), { fallback, nonce });
}

export async function AusstelloTeaser({ fallback, nonce, backendUrl, ...options }: TeaserProps) {
    await connection();
    return render(await loadTeaser(options, backendUrl), { fallback, nonce });
}

export async function AusstelloDetail({ segment, basePath, fallback, nonce, backendUrl }: DetailProps) {
    await connection();
    const outcome = await loadDetail(segment, basePath, backendUrl);
    if (outcome.kind === 'notFound') {
        notFound();
    }
    return render(outcome, { fallback, nonce });
}
