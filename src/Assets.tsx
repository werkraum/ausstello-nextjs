import type { EnvelopeAssets, EnvelopeHead } from './envelope';

/** JSON-LD im Body: < escaped, damit Redakteurseingaben das <script> nicht schließen. */
export function jsonLdString(data: unknown): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function inlineCssString(css: string): string {
    return css.replace(/<\/(style)/gi, '<\\/$1');
}

type Props = { assets: EnvelopeAssets; head: EnvelopeHead; nonce?: string };

/**
 * React 19 hebt <link rel="stylesheet" precedence>, <script async src> und
 * <style href precedence> in den <head> und nimmt jede Datei nur einmal – auch
 * wenn Liste und Teaser auf derselben Seite stehen.
 */
export function Assets({ assets, head, nonce }: Props) {
    return (
        <>
            {assets.css.map((href) => (
                <link key={href} rel="stylesheet" href={href} precedence="ausstello" />
            ))}
            {assets.js.map((script) => (
                <script key={script.src} type={script.type} src={script.src} async nonce={nonce} />
            ))}
            {assets.inlineCss !== '' && (
                <style href="ausstello-style-variables" precedence="ausstello" nonce={nonce}>
                    {inlineCssString(assets.inlineCss)}
                </style>
            )}
            {head.links.map((link) => (
                <link key={`${link.rel} ${link.href}`} rel={link.rel} href={link.href} />
            ))}
            {head.jsonLd.map((data, index) => (
                <script key={index} type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
            ))}
        </>
    );
}
