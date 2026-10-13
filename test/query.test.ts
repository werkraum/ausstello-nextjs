import { describe, expect, it } from 'vitest';
import { detailQuery, isValidSegment, listQuery } from '../src/query';

describe('listQuery', () => {
    it('reicht nur page und filter[...] durch', () => {
        const query = new URLSearchParams(listQuery('list', { basePath: '/veranstaltungen' }, {
            'filter[query]': 'Jazz',
            'filter[tags][]': ['1', '2'],
            page: '2',
            utm_source: 'x',
            base: '/fremd',
        }));
        expect(query.get('filter[query]')).toBe('Jazz');
        expect(query.getAll('filter[tags][]')).toEqual(['1', '2']);
        expect(query.get('page')).toBe('2');
        expect(query.get('utm_source')).toBeNull();
        expect(query.getAll('base')).toEqual(['/veranstaltungen']);
    });

    it('ist unabhängig von der Reihenfolge der Besucherparameter', () => {
        const a = listQuery('list', { basePath: '/v' }, { page: '2', 'filter[query]': 'a' });
        const b = listQuery('list', { basePath: '/v' }, { 'filter[query]': 'a', page: '2' });
        expect(a).toBe(b);
    });

    it('übergibt Teaser-Optionen', () => {
        const query = new URLSearchParams(listQuery('teaser', { basePath: '/v', preset: { tags: [3, 4] }, perPage: 3, filterbar: false }));
        expect(query.get('view')).toBe('teaser');
        expect(query.getAll('preset[tags][]')).toEqual(['3', '4']);
        expect(query.get('perPage')).toBe('3');
        expect(query.get('filterbar')).toBe('0');
    });

    it('lässt undefined-Werte weg', () => {
        expect(listQuery('list', { basePath: '/v' }, { page: undefined })).toBe('base=%2Fv');
    });
});

describe('detailQuery', () => {
    it('setzt base', () => {
        expect(detailQuery('/veranstaltungen')).toBe('base=%2Fveranstaltungen');
    });
});

describe('isValidSegment', () => {
    it.each([
        ['Konzert-705-06-10-1930-2200', true],
        ['123', true],
        ['', false],
        ['a/b', false],
        ['a%2Fb', false],
        ['ä', false],
        ['a'.repeat(201), false],
    ])('%s → %s', (segment, expected) => {
        expect(isValidSegment(segment)).toBe(expected);
    });
});
