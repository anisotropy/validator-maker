type Matcher = { pattern: string; message: string }

type Validator = (value: string) => string

type Message = (invalidString: string) => string

type Config = { defaultMessage: Message }

const defaultConfig: Config = { defaultMessage: (invalidString: string) => `'${invalidString}' is NOT allowed.` }

// @level 4
const isMatcher = (matcherOrMessage: Matcher | Message | Validator): matcherOrMessage is Matcher =>
  typeof matcherOrMessage !== 'function'

// @level 4
const isMessage = (matcherOrMessage: Matcher | Message): matcherOrMessage is Message =>
  typeof matcherOrMessage === 'function'

// @level 4
const filterTruthy = <T>(array: T[]) =>
  array.filter((value) => value !== '' && value !== null && value !== undefined) as NonNullable<T>[]

// @level 3
const orOperator =
  (config: Config) =>
  (...matcherOrMessages: (Matcher | Message)[]): Validator => {
    const matchers = matcherOrMessages.filter(isMatcher)
    const message = matcherOrMessages.filter(isMessage)[0] ?? config.defaultMessage
    return (value: string) => {
      const regexps = matchers.map(({ pattern }) => new RegExp(pattern))
      const remainders = regexps.reduce(
        (remainders, regexp) => remainders.map((r) => r.split(regexp).filter((r) => r)).flat(),
        [value]
      )
      return remainders.length > 0 ? message(remainders[0]) : ''
    }
  }

// @level 3
const andOperator =
  () =>
  (...matcherOrMessages: (Matcher | Message)[]): Validator => {
    const matchers = matcherOrMessages.filter(isMatcher)
    const message = matcherOrMessages.filter(isMessage)[0]
    return (value: string) =>
      matchers.reduce((resultMessage, matcher) => {
        if (resultMessage) return resultMessage
        const regexp = new RegExp(`^${matcher.pattern}$`)
        return regexp.test(value) ? '' : message?.(value) ?? matcher.message
      }, '')
  }

// @level 3
const notOperator =
  (config: Config) =>
  (...matcherOrMessages: (Matcher | Message)[]): Validator => {
    const matcher = matcherOrMessages.filter(isMatcher)[0]
    const message = matcherOrMessages.filter(isMessage)[0]
    return (value: string) => {
      const regexp = new RegExp(matcher.pattern, 'g')
      const matches = filterTruthy(value.match(regexp) ?? [])
      return matches.length > 0 ? (message ?? config.defaultMessage)(matches[0]) : ''
    }
  }

// @level 2
const mergeValidator =
  () =>
  (...validatorOrMatchers: (Validator | Matcher)[]): Validator => {
    const validators = validatorOrMatchers.map((vm) => (isMatcher(vm) ? andOperator()(vm) : vm))
    return (value: string) =>
      validators.reduce((message, validator) => {
        if (message) return message
        return validator(value)
      }, '')
  }

// @level 2
const makeMatcher =
  () =>
  (pattern: string, message: string): Matcher => {
    if (pattern.startsWith('^')) throw new Error(`'pattern' should NOT be started with '^'`)
    if (pattern.endsWith('$')) throw new Error(`'pattern' should NOT be ended with '$'`)
    return { pattern, message }
  }

// @level 1
const make = makeMatcher()

// @level 1
const or = orOperator(defaultConfig)

// @level 1
const and = andOperator()

// @level 1
const not = notOperator(defaultConfig)

// @level 1
const merge = mergeValidator()

// @level 1
const createValidatorMaker = (config: Config) => ({
  make: makeMatcher(),
  or: orOperator(config),
  and: andOperator(),
  not: notOperator(config),
  merge: mergeValidator(),
})

const validatorMaker = { make, or, and, not, merge }

export type { Message, Matcher, Validator }
export { make, or, and, not, merge, createValidatorMaker }
export default validatorMaker
