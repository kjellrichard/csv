
import { expect, it, describe } from 'vitest'
import { unlink, writeFile } from 'fs/promises'
import { fromCsv, readCsv, toCsv, Writeable, writeCsv } from '../src/csv'

describe('Csv', () => {
    it('should write csv', async () => {
        const data = [
            { id: 1, name: 'John Doe', born: new Date(), nicks: ['man', 'dude'] },
            { id: 2, name: 'Jane Doe', born: new Date('2000-01-01'), nicks: ['girl', 'woman'] }
        ]
        const filePath = await writeCsv(data, 'test.csv')
        const loadedData = await readCsv(filePath, { mapping: { id: { type: 'number' }, born: { type: 'date' } } })
        expect(loadedData).toEqual(data)
        await unlink(filePath)
    })

    it('parse and serialize correctly', async () => {
        const text = `Id,Name,Born,Colors,Joined,KidsAge
1,"Doe, John",2000,red|blue,2021-01-01,5|7
2,"Doe, Jane",2001,green|yellow,2021-01-02,3|4
3,"Mouse,Mickey",2002,black|white,2021-01-03,1|2
4,"Mick "The man" Jagger",1943,purple|orange,2021-01-04,8|9`

        const data = await fromCsv<Writeable>(text, { separator: ',' })
        expect(data).toEqual([
            { Id: 1, Name: 'Doe, John', Born: 2000, Colors: ['red', 'blue'], Joined: new Date('2021-01-01'), KidsAge: [5, 7] },
            { Id: 2, Name: 'Doe, Jane', Born: 2001, Colors: ['green', 'yellow'], Joined: new Date('2021-01-02'), KidsAge: [3, 4] },
            { Id: 3, Name: 'Mouse,Mickey', Born: 2002, Colors: ['black', 'white'], Joined: new Date('2021-01-03'), KidsAge: [1, 2] },
            { Id: 4, Name: 'Mick "The man" Jagger', Born: 1943, Colors: ['purple', 'orange'], Joined: new Date('2021-01-04'), KidsAge: [8, 9] }
        ])
        const csvText = toCsv(data, { separator: '\t' })
        const data2 = await fromCsv(csvText, { separator: '\t' })
        expect(data2).toEqual(data)
    })

    it('parse and serialize correctly even if data is not ended perfectly', async () => {
        const text = `Id,Name,Born,Colors,Joined,KidsAge
1,"Doe, John",2000,red|blue,2021-01-01,5|7
2,"Doe, Jane",2001,green|yellow,2021-01-02,3|4
`

        const data = await fromCsv<Writeable>(text, { separator: ',' })
        expect(data).toEqual([
            { Id: 1, Name: 'Doe, John', Born: 2000, Colors: ['red', 'blue'], Joined: new Date('2021-01-01'), KidsAge: [5, 7] },
            { Id: 2, Name: 'Doe, Jane', Born: 2001, Colors: ['green', 'yellow'], Joined: new Date('2021-01-02'), KidsAge: [3, 4] }
        ])
        const csvText = toCsv(data, { separator: '\t' })
        const data2 = await fromCsv(csvText, { separator: '\t' })
        expect(data2).toEqual(data)
    })


    it('should handle other separators', async () => {
        const text = `Id;KidsAge
1;5,7
2;3,4`
        const parsed = await fromCsv(text, { separator: ';', arraySeparator: ',' })
        const data = [
            { Id: 1, KidsAge: [5, 7] },
            { Id: 2, KidsAge: [3, 4] }
        ]
        expect(parsed).toEqual(data)
    })

    it('should detect separator', async () => {
        const text = `Id;Name
1;John
2;Jane`
        const parsed = await fromCsv(text)
        const data = [
            { Id: 1, Name: 'John' },
            { Id: 2, Name: 'Jane' }
        ]
        expect(parsed).toEqual(data)
    })

})