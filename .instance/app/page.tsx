import { AusstelloTeaser } from '@werkraum/ausstello-next';

export default function Home() {
    return (
        <>
            <h1>Start</h1>
            <AusstelloTeaser basePath="/veranstaltungen" perPage={3} />
        </>
    );
}
