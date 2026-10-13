import type { Metadata } from 'next';
import type { EnvelopeHead } from './envelope';

type Image = { url: string; width?: number; height?: number; alt?: string };

/**
 * Regeln wie EnvelopeApplier der TYPO3-Extension: Titel mit Suffix, robots nur
 * verschärfen, erste Angabe je Schlüssel gewinnt, mehrere og:image bleiben mehrere.
 */
export function toMetadata(head: EnvelopeHead): Metadata {
    const metadata: Metadata = {};

    if (head.title !== null) {
        metadata.title = head.titleSuffix !== null ? { absolute: `${head.title} – ${head.titleSuffix}` } : head.title;
    }
    if (head.description !== null) {
        metadata.description = head.description;
    }
    if (head.canonical !== null) {
        metadata.alternates = { canonical: head.canonical };
    }
    if (head.robots !== null && /\b(noindex|nofollow)\b/i.test(head.robots)) {
        metadata.robots = head.robots;
    }

    const openGraph: Record<string, unknown> = {};
    const images: Image[] = [];
    const twitter: Record<string, string> = {};
    const other: Record<string, string[]> = {};

    for (const { key, content } of head.meta) {
        if (key === 'og:image') {
            images.push({ url: content });
        } else if (key.startsWith('og:image:')) {
            const image = images.at(-1);
            const field = key.slice('og:image:'.length);
            if (image !== undefined && (field === 'width' || field === 'height')) {
                image[field] = Number(content);
            } else if (image !== undefined && field === 'alt') {
                image.alt = content;
            }
        } else if (key.startsWith('og:')) {
            const field = key.slice('og:'.length);
            if (!(field in openGraph)) {
                openGraph[field] = content;
            }
        } else if (key.startsWith('twitter:')) {
            const field = key.slice('twitter:'.length);
            if (!(field in twitter)) {
                twitter[field] = content;
            }
        } else {
            (other[key] ??= []).push(content);
        }
    }

    if (images.length > 0) {
        openGraph.images = images;
    }
    if (Object.keys(openGraph).length > 0) {
        metadata.openGraph = openGraph as Metadata['openGraph'];
    }
    if (Object.keys(twitter).length > 0) {
        metadata.twitter = twitter as Metadata['twitter'];
    }
    if (Object.keys(other).length > 0) {
        metadata.other = Object.fromEntries(Object.entries(other).map(([key, values]) => [key, values.length === 1 ? values[0]! : values]));
    }

    return metadata;
}
