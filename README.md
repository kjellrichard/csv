# csv

## Installation

Using npm

```bash
npm install @ricb/csv
```

## Usage

This project provides functionality to write and read CSV files, as well as parse and serialize CSV data.

* By default it will use `","` as separator and `"|"` as array separator when writing.
* By default it will try to detect data type for values when parsing.
* It will try to detect value separator if not explicitly specified.

See [CsvOption](#CsvOption) for more info

### Writing and Reading CSV

```typescript
import { writeCsv, readCsv } from '@ricb/csv';

const data = [
    { id: 1, name: 'John Doe', born: new Date(), nicks: ['man', 'dude'] },
    { id: 2, name: 'Jane Doe', born: new Date('2000-01-01'), nicks: ['girl', 'woman'] }
];

const filePath = await writeCsv(data, 'test.csv'); 

const loadedData = await readCsv(filePath)
console.log(loadedData);
```

### Parsing and Serializing CSV

```typescript
import { fromCsv, toCsv } from '@ricb/csv'

const text = `Id,Name,Born,Colors,Joined,KidsAge
1,"Doe, John",2000,red|blue,2021-01-01,5|7
2,"Doe, Jane",2001,green|yellow,2021-01-02,3|4
3,"Mouse,Mickey",2002,black|white,2021-01-03,1|2
4,"Mick "The man" Jagger",1943,purple|orange,2021-01-04,8|9`;

const data = await fromCsv(text, { separator: ',' });
const csvText = toCsv(data, { separator: '\t' });
const data2 = await fromCsv(csvText, { separator: '\t' });

console.log(data2);
```

### CsvOptions

`CsvOptions` is a type that allows you to customize how CSV data is processed. Here are the properties it can have:

* `fields`: An array of strings specifying the order of the fields when writing CSV data. If not provided, the fields will be written in the order they appear in the data object.

* `separator`: A string that specifies the character used to separate fields in the CSV data. If not provided, a comma (",") is used by default.

* `arraySeparator`: A string that specifies the character used to separate array elements in the CSV data. If not provided, a pipe ("|") is used by default.

* `mapping`: An object that maps field names to their types. This is used when reading CSV data to convert string values to their appropriate types. If not provided, all values are treated as strings.

* `detectTypes`: A boolean that specifies whether to automatically detect and convert types when reading CSV data. If not provided, this is `true` by default.

```typescript
const options: CsvOptions = {
    fields: ['id', 'name', 'born', 'nicks'],
    separator: ',',
    arraySeparator: '|',
    mapping: { id: { type: 'number' }, born: { type: 'date' } },
    detectTypes: true
};

const loadedData = await readCsv(filePath, options);
