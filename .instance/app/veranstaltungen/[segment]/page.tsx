import { AusstelloDetail, detailMetadata } from '@werkraum/ausstello-next';

type Props = { params: Promise<{ segment: string }> };

export const generateMetadata = async ({ params }: Props) =>
    detailMetadata({ segment: (await params).segment, basePath: '/veranstaltungen' });

export default async function Page({ params }: Props) {
    return <AusstelloDetail segment={(await params).segment} basePath="/veranstaltungen" />;
}
