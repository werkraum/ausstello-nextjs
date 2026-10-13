import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = { title: { default: 'ausstello Testinstanz', template: '%s | Testinstanz' } };

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="de">
            <body>
                <nav>
                    <Link href="/">Start</Link> · <Link href="/veranstaltungen">Veranstaltungen</Link>
                </nav>
                <main>{children}</main>
            </body>
        </html>
    );
}
