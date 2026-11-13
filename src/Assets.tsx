import type { EnvelopeAssets, EnvelopeHead } from './envelope';

/** JSON-LD im Body: < escaped, damit Redakteurseingaben das <script> nicht schließen. */
export function jsonLdString(data: unknown): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function inlineCssString(css: string): string {
    return css.replace(/<\/(style)/gi, '<\\/$1');
}

/** Teile der Output-Assets abschalten, z. B. wenn die Seite eigenes CSS mitbringt. Vorgabe: alles an. */
export type AssetSwitches = {
    /** Stylesheets des Backends */
    styles?: boolean;
    /** Output-JavaScript des Backends */
    scripts?: boolean;
    /** Stilvariablen aus Einstellungen > Stil */
    settings?: boolean;
};

type Props = { assets: EnvelopeAssets; head: EnvelopeHead; nonce?: string } & AssetSwitches;

/**
 * React 19 hebt <link rel="stylesheet" precedence>, <script async src> und
 * <style href precedence> in den <head> und nimmt jede Datei nur einmal – auch
 * wenn Liste und Teaser auf derselben Seite stehen. Die Stilvariablen heißen je
 * Instanz anders, damit zwei Backends auf einer Seite beide behalten.
 */
export function Assets({ assets, head, nonce, styles = true, scripts = true, settings = true }: Props) {
    return (
        <>
            {styles && assets.css.map((href) => (
                <link key={href} rel="stylesheet" href={href} precedence="ausstello" />
            ))}
            {scripts && assets.js.map((script) => (
                <script key={script.src} type={script.type} src={script.src} async nonce={nonce} />
            ))}
            {settings && assets.inlineCss !== '' && (
                <style href={assets.instance === null ? 'ausstello-style-variables' : `ausstello-style-variables-${assets.instance}`} precedence="ausstello" nonce={nonce}>
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
