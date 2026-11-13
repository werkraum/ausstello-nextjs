import 'server-only';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import type { AssetSwitches } from './Assets';
import type { Outcome } from './envelope';
import { Fragment } from './Fragment';
import { type Awaitable, loadDetail, loadList, loadTeaser } from './load';
import type { ListOptions, SearchParams } from './query';

type Common = {
    fallback?: ReactNode;
    nonce?: string;
    /** Anderes ausstello-Backend als AUSSTELLO_BACKEND_URL für diese Komponente. */
    backendUrl?: string;
} & AssetSwitches;

export type ListProps = ListOptions & Common & { searchParams?: Awaitable<SearchParams> };
export type TeaserProps = Omit<ListOptions, 'filterbar'> & Common;
export type DetailProps = { segment: string; basePath: string } & Common;

function render(outcome: Outcome, { fallback, nonce, styles, scripts, settings }: Common) {
    if (outcome.kind === 'ok') {
        return <Fragment envelope={outcome.envelope} nonce={nonce} styles={styles} scripts={scripts} settings={settings} />;
    }
    return <>{outcome.kind === 'unavailable' ? fallback ?? null : null}</>;
}

export async function AusstelloList({ searchParams, fallback, nonce, backendUrl, styles, scripts, settings, ...options }: ListProps) {
    await connection();
    return render(await loadList(options, searchParams, backendUrl), { fallback, nonce, styles, scripts, settings });
}

export async function AusstelloTeaser({ fallback, nonce, backendUrl, styles, scripts, settings, ...options }: TeaserProps) {
    await connection();
    return render(await loadTeaser(options, backendUrl), { fallback, nonce, styles, scripts, settings });
}

export async function AusstelloDetail({ segment, basePath, fallback, nonce, backendUrl, styles, scripts, settings }: DetailProps) {
    await connection();
    const outcome = await loadDetail(segment, basePath, backendUrl);
    if (outcome.kind === 'notFound') {
        notFound();
    }
    return render(outcome, { fallback, nonce, styles, scripts, settings });
}
