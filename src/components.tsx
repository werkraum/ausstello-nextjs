import 'server-only';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import type { Outcome } from './envelope';
import { Fragment } from './Fragment';
import { type Awaitable, loadDetail, loadList, loadTeaser } from './load';
import type { ListOptions, SearchParams } from './query';

type Common = { fallback?: ReactNode; nonce?: string };

export type ListProps = ListOptions & Common & { searchParams?: Awaitable<SearchParams> };
export type TeaserProps = Omit<ListOptions, 'filterbar'> & Common;
export type DetailProps = { segment: string; basePath: string } & Common;

function render(outcome: Outcome, { fallback, nonce }: Common) {
    if (outcome.kind === 'ok') {
        return <Fragment envelope={outcome.envelope} nonce={nonce} />;
    }
    return <>{outcome.kind === 'unavailable' ? fallback ?? null : null}</>;
}

export async function AusstelloList({ searchParams, fallback, nonce, ...options }: ListProps) {
    await connection();
    return render(await loadList(options, searchParams), { fallback, nonce });
}

export async function AusstelloTeaser({ fallback, nonce, ...options }: TeaserProps) {
    await connection();
    return render(await loadTeaser(options), { fallback, nonce });
}

export async function AusstelloDetail({ segment, basePath, fallback, nonce }: DetailProps) {
    await connection();
    const outcome = await loadDetail(segment, basePath);
    if (outcome.kind === 'notFound') {
        notFound();
    }
    return render(outcome, { fallback, nonce });
}
