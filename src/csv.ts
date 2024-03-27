import { readFile, writeFile } from 'fs/promises'

export type CsvMappingType = 'number' | 'string' | 'boolean' | 'date'
export type CsvMappingItem = {
    type: CsvMappingType
}

export type CsvMapping = { [key: string]: CsvMappingItem }

export type CsvOptions = {
    fields?: string[]
    separator?: string
    arraySeparator?: string
    mapping?: CsvMapping
    detectTypes?: boolean
    detectSeparator?: boolean
}

export const SaveCsvDefaultOptions: CsvOptions = {
    separator: ',',
    arraySeparator: '|'
}

export const LoadCsvDefaultOptions: CsvOptions = {
    separator: undefined,
    arraySeparator: SaveCsvDefaultOptions.arraySeparator,
    detectTypes: true
}

function splitLine(line: string, separator: string) {
    const values = []
    let value = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            inQuote = !inQuote
            value += char
        } else if (char === separator && !inQuote) {
            values.push(value)
            value = ''
        } else {
            value += char
        }
    }
    values.push(value)
    return values
}

function getMappingValue(value: string, type?: CsvMappingType | 'auto', arraySeparator = ','): unknown {
    if (value.startsWith('"') && value.endsWith('"')) {
        //replace quotes in start and end of value
        value = value.replace(/^"|"$/g, '')
    }

    if (value.includes(arraySeparator)) {
        const values = splitLine(value, arraySeparator)
        return values.map(v => getMappingValue(v, type, arraySeparator))
    }

    if (type === 'auto') {
        if (/^\d+$/.test(value))
            type = 'number'
        else if (
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
            || /^\d{4}-\d{2}-\d{2}/.test(value)
        )
            type = 'date'
        else if (/true|false/i.test(value))
            type = 'boolean'
        else
            type = 'string'
    }
    switch (type) {
        case 'number':
            return +value
        case 'boolean':
            return /true/ig.test(value)
        case 'date':
            return new Date(value)
    }
    return value
}

export function toCsv(data: Record<string, unknown>[], options: CsvOptions = {}): string {
    const { separator, fields, arraySeparator } = { ...SaveCsvDefaultOptions, ...options }
    const headers = fields ?? Object.keys(data[0])
    const lines = [headers.join(separator)]
    data.forEach(obj => {
        const line = headers.map(header => {
            let value = obj[header]
            if (Array.isArray(value)) {
                value = `${value.join(arraySeparator)}`
            }

            if (typeof value === 'string') {
                if (value.includes(separator!) || value.includes(arraySeparator!))
                    return `"${value.replace(/"/g, '""')}"`
                return value
            }
            if (typeof value === 'object' && value instanceof Date) {
                return value.toISOString()
            }
            return value
        }).join(separator)
        lines.push(line)
    })
    return lines.join('\n')
}

export async function writeCsv(data: Record<string, unknown>[], filePath: string, options: CsvOptions = {}): Promise<string> {
    await writeFile(filePath, toCsv(data, options))
    return filePath
}

// return the separator that appears the most in the first line
function detectSeparator(text: string): string {
    const separators = [',', ';', '\t']
    const counts = separators.map(sep => ({ sep, count: (text.match(new RegExp(sep, 'g')) || []).length }))
    if (counts.every(c => c.count === 0))
        throw new Error('No separator found in the first line')
    return counts.sort((a, b) => b.count - a.count)[0].sep
}

export function fromCsv<T extends Record<string, unknown>>(text: string, options: CsvOptions = {}): T[] {
    const { separator: _sep, fields, mapping, detectTypes, arraySeparator } = { ...LoadCsvDefaultOptions, ...options }

    const lines = text.split('\n')
    const separator = _sep ?? detectSeparator(lines[0])

    const fileData = lines
        .map(line => splitLine((line ?? '').replace(/\r/g, ''), separator!))
    const headers = fields ?? fileData[0]
    const objects: T[] = []

    for (let i = 1; i < fileData.length; i++) {
        const values = fileData[i]
        const obj2 = headers.reduce((acc, header, index) => {
            let type = mapping?.[header]?.type as CsvMappingType | 'auto' | undefined
            if (!type && detectTypes)
                type = 'auto'
            acc[header] = getMappingValue(values[index], type, arraySeparator)
            return acc
        }, {} as Record<string, unknown>)
        objects.push(obj2 as T)
    }
    return objects
}
export async function readCsv<T extends Record<string, unknown>>(filePath: string, options: CsvOptions = {}): Promise<T[]> {
    const fileContent = await readFile(filePath, 'utf-8')
    return fromCsv(fileContent, options)
}