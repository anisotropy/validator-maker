import { and, make, merge, not, or, createValidatorMaker } from './index'

const alpha = make('[a-z]+', 'Only alphabets allowed.')
const number = make('[0-9]+', 'Only numbers allowed.')
const len = (n: number) => make(`.{${n}}`, `Must be ${n} characters long.`)

describe('index.ts', () => {
  describe('makeMatcher', () => {
    const testCases: ({ params: [string, string] } & (
      | { expected: { pattern: string; message: string } }
      | { error: string }
    ))[] = [
      {
        params: ['[a-z]+', 'Only alphabets allowed.'],
        expected: { pattern: '[a-z]+', message: 'Only alphabets allowed.' },
      },
      { params: ['^[a-z]+', 'Only alphabets allowed.'], error: `'pattern' should NOT be started with '^'` },
      { params: ['[a-z]+$', 'Only alphabets allowed.'], error: `'pattern' should NOT be ended with '$'` },
    ]
    test.each(testCases)('$params -> expected', (testCase) => {
      if ('error' in testCase) {
        expect(() => make(...testCase.params)).toThrowError(testCase.error)
      } else {
        const matcher = make(...testCase.params)
        expect(matcher).toEqual(testCase.expected)
      }
    })
  })

  describe('or(), and(), not()', () => {
    const testCases = [
      {
        operator: 'or',
        matchers: [
          { pattern: '[a-z]+', message: 'Only alphabets allowed.' },
          { pattern: '[0-9]+', message: 'Only numbers allowed.' },
          { pattern: '[\\s,.]+', message: 'Only numbers allowed.' },
        ],
        values: [
          { value: 'abc', message: '' },
          { value: '123', message: '' },
          { value: 'abc, 123.', message: '' },
          { value: 'abc, 123, abc, 123.', message: '' },
          { value: 'ABC', message: `'ABC' is NOT allowed.` },
          { value: 'abc, ABC, abc, DEF.', message: `'ABC' is NOT allowed.` },
          { value: 'ab, 123!', message: `'!' is NOT allowed.` },
        ],
      },
      {
        operator: 'and',
        matchers: [
          { pattern: '[a-z]+', message: 'Only alphabets allowed.' },
          { pattern: '.{3,}', message: 'Must be 3 or more characters long.' },
          { pattern: '.{0,5}', message: 'Must be 5 or fewer characters long.' },
        ],
        values: [
          { value: 'abc', message: '' },
          { value: 'abcd', message: '' },
          { value: 'abcde', message: '' },
          { value: '123', message: 'Only alphabets allowed.' },
          { value: 'ab', message: 'Must be 3 or more characters long.' },
          { value: 'abcdef', message: 'Must be 5 or fewer characters long.' },
        ],
      },
      {
        operator: 'not',
        matchers: [{ pattern: '[a-z]+', message: 'Only alphabets allowed.' }],
        values: [
          { value: 'ABC', message: '' },
          { value: '123', message: '' },
          { value: 'ab', message: `'ab' is NOT allowed.` },
          { value: '123ab', message: `'ab' is NOT allowed.` },
        ],
      },
    ]
    describe.each(testCases)(
      '$operator($matchers.0.pattern, $matchers.1.pattern, ...)',
      ({ operator, matchers, values }) => {
        const validator =
          operator === 'not' ? not(matchers[0]) : operator === 'and' ? and(...matchers) : or(...matchers)
        test.each(values)('$value -> $message', ({ value, message }) => expect(validator(value)).toBe(message))
      }
    )
  })

  describe('merge()', () => {
    const testCases = [
      { params: [alpha], value: 'abc', expected: '' },
      { params: [alpha], value: '123', expected: 'Only alphabets allowed.' },
      { params: [or(alpha, number)], value: 'abc123', expected: '' },
      { params: [or(alpha, number)], value: 'ABC', expected: `'ABC' is NOT allowed.` },
      { params: [and(alpha, len(5))], value: 'abcde', expected: '' },
      { params: [and(alpha, len(5))], value: 'a', expected: `Must be 5 characters long.` },
      { params: [not(alpha)], value: '1234', expected: '' },
      { params: [not(alpha)], value: 'abc', expected: `'abc' is NOT allowed.` },
      { params: [alpha, len(7)], value: 'abcdefg', expected: '' },
      { params: [alpha, len(7)], value: '123', expected: 'Only alphabets allowed.' },
    ]
    test.each(testCases)('$value -> $expected', ({ params, value, expected }) => {
      const validator = merge(...params)
      expect(validator(value)).toBe(expected)
    })
  })

  describe('or(), and(), not(): custom error message', () => {
    const testCases = [
      { validator: or(alpha, number), value: '!@', expected: `'!@' is NOT allowed.` },
      {
        validator: or(alpha, number, (invalidString) => `'${invalidString}' is NOT valid.`),
        value: '!@',
        expected: `'!@' is NOT valid.`,
      },
      { validator: and(alpha, len(3)), value: 'abcd', expected: `Must be 3 characters long.` },
      {
        validator: and(alpha, len(3), (invalidString) => `'${invalidString}' is NOT valid.`),
        value: 'abcd',
        expected: `'abcd' is NOT valid.`,
      },
      { validator: not(alpha), value: 'abcd', expected: `'abcd' is NOT allowed.` },
      {
        validator: not(alpha, (invalidString) => `'${invalidString}' is NOT valid.`),
        value: 'abcd',
        expected: `'abcd' is NOT valid.`,
      },
    ]
    test.each(testCases)('$value -> $expected', ({ validator, value, expected }) => {
      expect(validator(value)).toBe(expected)
    })
  })

  // TODO: config.defaultMessage
  describe('Configuration', () => {
    const va = createValidatorMaker({ defaultMessage: (invalidString) => `'${invalidString}' is NOT valid.` })
    const testCases = [
      { validator: va.or(alpha, number), value: '!@', expected: `'!@' is NOT valid.` },
      { validator: va.not(alpha), value: 'abcd', expected: `'abcd' is NOT valid.` },
      { validator: va.merge(va.or(alpha, number), len(5)), value: 'ABC12', expected: `'ABC' is NOT valid.` },
    ]
    test.each(testCases)('$value -> $expected', ({ validator, value, expected }) => {
      expect(validator(value)).toBe(expected)
    })
  })
})
