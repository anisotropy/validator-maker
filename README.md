# validator-maker

This library allows you to create complex validators from simple ones.

## Installation

```bash
npm i validator-maker
```

or

```bash
pnpm add validator-maker
```

## Basic usage

```ts
import { make, and, or, not, merge } from 'validator-maker'

const alphabet = make('[a-zA-Z]+', 'Only alphabets are allowed.')
const number = make('[0-9]+', 'Only numbers are allowed.')
const length = (len: number) => make(`.{${len}}`, `Must be ${len} characters long.`)

const alphabetOrNumber = or(alphabet, number)
alphabetOrNumber('abc123') // -> ''
alphabetOrNumber('abc!@') // -> `'!@' is NOT allowed`

const fiveLongAlphabets = and(alphabet, length(5))
fiveLongAlphabets('abcde') // -> ''
fiveLongAlphabets('abcdefg') // -> 'Must be 5 characters long.'
fiveLongAlphabets('12345') // -> 'Only alphabets are allowed.'

const notAlphabet = not(alphabet)
notAlphabet('123') // -> ''
notAlphabet('abc123') // -> `'abc' is NOT allowed.`

const fiveLongAlphabetOrNumber = merge(alphabetOrNumber, length(5))
fiveLongAlphabetOrNumber('abc12') // -> ''
fiveLongAlphabetOrNumber('abc12345') // -> 'Must be 5 characters long.'
```

## Custom error message

```ts
import { make, and, or, not, merge } from 'validator-maker'

const alphabet = make('[a-zA-Z]+', 'Only alphabets are allowed.')
const number = make('[0-9]+', 'Only numbers are allowed.')
const length = (len: number) => make(`.{${len}}`, `Must be ${len} characters long.`)

const alphabetOrNumber = or(alphabet, number, (invalid) => `'${invalid}' is NOT valid.`)
alphabetOrNumber('abc!@') // -> `'!@' is NOT valid`

const fiveLongAlphabets = and(alphabet, length(5), () => 'Must be 5-long alphabets.')
fiveLongAlphabets('12345') // -> 'Must be 5-long alphabets.'

const notAlphabet = not(alphabet, (invalid) => `'${invalid}' is NOT valid.`)
notAlphabet('abc123') // -> `'abc' is NOT valid.`
```

## Set default message

```ts
import { createValidatorMaker } from 'validator-maker'

const va = createValidatorMaker({ defaultMessage: (invalid) => `'${invalid}' is NOT valid.` })

const alphabet = va.make('[a-zA-Z]+', 'Only alphabets are allowed.')
const number = va.make('[0-9]+', 'Only numbers are allowed.')

const alphabetOrNumber = va.or(alphabet, number)
alphabetOrNumber('abc!@') // -> `'!@' is NOT valid`
```
