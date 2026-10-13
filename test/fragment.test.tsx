import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Assets, inlineCssString, jsonLdString } from '../src/Assets';
import type { Envelope } from '../src/envelope';
import { Fragment, signature } from '../src/Fragment';

const envelope: Envelope = {
    status: 200,
    html: '<div class="ausstello">Liste</div>',
    head: {
        title: null, titleSuffix: null, description: null, canonical: null, robots: null, meta: [],
        links: [{ rel: 'next', href: 'https://kunde.de/v?page=2' }],
        jsonLd: [{ '@type': 'Event', name: '</script><script>alert(1)</script>' }],
    },
    assets: {
        css: ['https://b.de/output/a.css'],
        js: [{ src: 'https://b.de/output/a.js', type: 'module' }],
        inlineCss: ':root{--x:1}',
    },
    maxAge: 60,
};

describe('Assets', () => {
    it('rendert Stylesheets, Modul-Skripte, Inline-CSS, Links und JSON-LD', () => {
        const html = renderToStaticMarkup(<Assets assets={envelope.assets} head={envelope.head} nonce="abc" />);
        expect(html).toContain('href="https://b.de/output/a.css"');
        expect(html).toContain('data-precedence="ausstello"');
        expect(html).toMatch(/<script[^>]*src="https:\/\/b\.de\/output\/a\.js"/);
        expect(html).toContain('type="module"');
        expect(html).toContain(':root{--x:1}');
        expect(html).toContain('nonce="abc"');
        expect(html).toContain('rel="next"');
        expect(html).toContain('type="application/ld+json"');
        expect(html).not.toContain('</script><script>alert(1)');
    });

    it('rendert dieselben Assets zweier Fragmente nur einmal', () => {
        const html = renderToStaticMarkup(
            <>
                <Assets assets={envelope.assets} head={envelope.head} />
                <Assets assets={envelope.assets} head={envelope.head} />
            </>,
        );
        expect(html.split('href="https://b.de/output/a.css"').length - 1).toBe(1);
        expect(html.split('src="https://b.de/output/a.js"').length - 1).toBe(1);
        expect(html.split(':root{--x:1}').length - 1).toBe(1);
    });
});

describe('jsonLdString', () => {
    it('escaped <', () => {
        expect(jsonLdString({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}');
    });
});

describe('inlineCssString', () => {
    it('bricht </style> auf', () => {
        expect(inlineCssString('a{}</style><script>')).not.toContain('</style>');
    });
});

describe('Fragment', () => {
    it('setzt das HTML in ein div', () => {
        const html = renderToStaticMarkup(<Fragment envelope={envelope} />);
        expect(html).toContain('<div class="ausstello-next"><div class="ausstello">Liste</div></div>');
    });
});

describe('signature', () => {
    it('ist stabil und unterscheidet Inhalte', () => {
        expect(signature('a')).toBe(signature('a'));
        expect(signature('a')).not.toBe(signature('b'));
    });
});
