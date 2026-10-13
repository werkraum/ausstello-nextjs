import { AusstelloList, listMetadata, type SearchParams } from '@werkraum/ausstello-next';

type Props = { searchParams: Promise<SearchParams> };

export const generateMetadata = ({ searchParams }: Props) => listMetadata({ searchParams, basePath: '/veranstaltungen' });

export default function Page({ searchParams }: Props) {
    return <AusstelloList searchParams={searchParams} basePath="/veranstaltungen" fallback={<p>Termine sind gerade nicht verfügbar.</p>} />;
}
