import { AusstelloMount } from '@werkraum/ausstello-next/client';
import { Assets } from './Assets';
import type { Envelope } from './envelope';

/** Kurzer Fingerabdruck des HTML: neuer Inhalt an derselben Stelle ⇒ neuer Mount ⇒ neues ausstello:scan. */
export function signature(html: string): string {
    let hash = 5381;
    for (let i = 0; i < html.length; i++) {
        hash = ((hash << 5) + hash + html.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(36);
}

export function Fragment({ envelope, nonce }: { envelope: Envelope; nonce?: string }) {
    return (
        <>
            <Assets assets={envelope.assets} head={envelope.head} nonce={nonce} />
            <div className="ausstello-next" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: envelope.html }} />
            <AusstelloMount key={signature(envelope.html)} />
        </>
    );
}
