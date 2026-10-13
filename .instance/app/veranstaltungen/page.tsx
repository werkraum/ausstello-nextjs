import { AusstelloList, listMetadata, type SearchParams } from '@werkraum/ausstello-next';

type Props = { searchParams: Promise<SearchParams> };

export const generateMetadata = ({ searchParams }: Props) => listMetadata({ searchParams, basePath: '/veranstaltungen', perPage: 10 });

export default function Page({ searchParams }: Props) {
    return <AusstelloList searchParams={searchParams} basePath="/veranstaltungen" perPage={10} fallback={<p>Termine sind gerade nicht verfügbar.</p>} />;
}
