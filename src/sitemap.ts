import 'server-only';
import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { fetchJson, SITEMAP_MAX_AGE } from './client';
import { readConfig } from './config';

/**
 * Rendert immer dynamisch (connection), damit der Next-Data-Cache bei Ausfall die letzte Antwort liefert.
 * Für app/sitemap.ts: `export default sitemapEntries;`. Next ruft die Funktion dann selbst auf;
 * aus dem Argument zählt nur `backendUrl`, und nur als String.
 */
export async function sitemapEntries(options?: { backendUrl?: string }): Promise<MetadataRoute.Sitemap> {
    await connection();
    const backendUrl = typeof options?.backendUrl === 'string' ? options.backendUrl : undefined;
    const data = await fetchJson(readConfig(process.env, backendUrl), 'sitemap', SITEMAP_MAX_AGE);
    const items = typeof data === 'object' && data !== null && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : [];

    return items.flatMap((item) => {
        if (typeof item !== 'object' || item === null || typeof (item as { loc?: unknown }).loc !== 'string') {
            return [];
        }
        const { loc, lastmod } = item as { loc: string; lastmod?: unknown };
        return [typeof lastmod === 'string' && lastmod !== '' ? { url: loc, lastModified: lastmod } : { url: loc }];
    });
}
