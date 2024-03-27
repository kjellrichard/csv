
import { expect, it, describe } from 'vitest'
import { unlink, writeFile } from 'fs/promises'
import { loadFromFile, saveToFile } from '../src/csv'

describe('Csv', () => {
    it('should write csv', async () => {
        const data = [
            { id: 1, name: 'John Doe', born: new Date(), nicks: ['man', 'dude'] },
            { id: 2, name: 'Jane Doe', born: new Date('2000-01-01'), nicks: ['girl', 'woman'] }
        ]
        const filePath = await saveToFile(data, 'test.csv')
        const loadedData = await loadFromFile(filePath, { mapping: { id: { type: 'number' }, born: { type: 'date' } } })
        expect(loadedData).toEqual(data)
        await unlink(filePath)
    })

    it('should split line correctly', async () => {
        const text = `Id,Name,Born,Colors,Joined,KidsAge
1,"Doe, John",2000,red|blue,2021-01-01,5|7
2,"Doe, Jane",2001,green|yellow,2021-01-02,3|4
3,"Mouse,Mickey",2002,black|white,2021-01-03,1|2
4,"Mick "The man" Jagger",1943,purple|orange,2021-01-04,8|9`
        const filePath = '_test.csv'
        await writeFile(filePath, text)
        const data = await loadFromFile(filePath, { separator: ',', arraySeparator: '|' })
        expect(data).toEqual([
            { Id: 1, Name: 'Doe, John', Born: 2000, Colors: ['red', 'blue'], Joined: new Date('2021-01-01'), KidsAge: [5, 7] },
            { Id: 2, Name: 'Doe, Jane', Born: 2001, Colors: ['green', 'yellow'], Joined: new Date('2021-01-02'), KidsAge: [3, 4] },
            { Id: 3, Name: 'Mouse,Mickey', Born: 2002, Colors: ['black', 'white'], Joined: new Date('2021-01-03'), KidsAge: [1, 2] },
            { Id: 4, Name: 'Mick "The man" Jagger', Born: 1943, Colors: ['purple', 'orange'], Joined: new Date('2021-01-04'), KidsAge: [8, 9] }
        ])
        await saveToFile(data, filePath, { separator: '\t', arraySeparator: '|' })
        const data2 = await loadFromFile(filePath, { separator: '\t', arraySeparator: '|' })
        expect(data2).toEqual(data)
        unlink(filePath)
    })

})