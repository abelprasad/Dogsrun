import { describe, expect, it } from 'vitest'
import { dogMatchesCriteria, dogAgeRange, dogSizeClass } from './matching'

describe('dogAgeRange', () => {
  it('classifies dogs under 1 year as puppy', () => {
    expect(dogAgeRange(0.5)).toBe('puppy')
    expect(dogAgeRange(0)).toBe('puppy')
  })

  it('classifies dogs 1-2 years as youth', () => {
    expect(dogAgeRange(1)).toBe('youth')
    expect(dogAgeRange(1.5)).toBe('youth')
  })

  it('classifies dogs 2-8 years as adult', () => {
    expect(dogAgeRange(2)).toBe('adult')
    expect(dogAgeRange(5)).toBe('adult')
  })

  it('classifies dogs 8+ years as senior', () => {
    expect(dogAgeRange(8)).toBe('senior')
    expect(dogAgeRange(10)).toBe('senior')
  })
})

describe('dogSizeClass', () => {
  it('classifies under 20 lbs as xsmall', () => {
    expect(dogSizeClass(15)).toBe('xsmall')
  })

  it('classifies 20-30 lbs as small', () => {
    expect(dogSizeClass(20)).toBe('small')
    expect(dogSizeClass(25)).toBe('small')
  })

  it('classifies 30-50 lbs as medium', () => {
    expect(dogSizeClass(30)).toBe('medium')
    expect(dogSizeClass(40)).toBe('medium')
  })

  it('classifies 50-90 lbs as large', () => {
    expect(dogSizeClass(50)).toBe('large')
    expect(dogSizeClass(60)).toBe('large')
  })

  it('classifies 90+ lbs as xlarge', () => {
    expect(dogSizeClass(90)).toBe('xlarge')
    expect(dogSizeClass(100)).toBe('xlarge')
  })
})

describe('dogMatchesCriteria', () => {
  const baseDog = {
    breed: 'Labrador',
    color: ['black'],
    age_years: 3,
    weight_lbs: 55,
    sex: 'male',
    mix: false,
    state: 'PA',
    parvo: false,
    tripod: false,
    blind: false,
    other_issues: false,
  }

  it('matches when criteria accepts everything', () => {
    expect(dogMatchesCriteria(baseDog, {})).toBe(true)
  })

  it('rejects on breed mismatch', () => {
    expect(dogMatchesCriteria(baseDog, { breeds: ['Poodle'] })).toBe(false)
  })

  it('matches breed by case-insensitive substring', () => {
    expect(dogMatchesCriteria(baseDog, { breeds: ['labrador'] })).toBe(true)
  })

  it('rejects on color mismatch', () => {
    expect(dogMatchesCriteria(baseDog, { colors: ['white'] })).toBe(false)
  })

  it('rejects on age range mismatch', () => {
    // dog is 3 years = adult, criteria wants puppy
    expect(dogMatchesCriteria(baseDog, { age_ranges: ['puppy'] })).toBe(false)
    expect(dogMatchesCriteria(baseDog, { age_ranges: ['adult'] })).toBe(true)
  })

  it('rejects on size class mismatch', () => {
    // dog is 55 lbs = large
    expect(dogMatchesCriteria(baseDog, { size_classes: ['xsmall'] })).toBe(false)
    expect(dogMatchesCriteria(baseDog, { size_classes: ['large'] })).toBe(true)
  })

  it('rejects on sex mismatch but accepts "any"', () => {
    expect(dogMatchesCriteria(baseDog, { sex_preference: 'female' })).toBe(false)
    expect(dogMatchesCriteria(baseDog, { sex_preference: 'any' })).toBe(true)
  })

  it('rejects mixes when accepts_mixes is false', () => {
    expect(dogMatchesCriteria({ ...baseDog, mix: true }, { accepts_mixes: false })).toBe(false)
    expect(dogMatchesCriteria({ ...baseDog, mix: true }, { accepts_mixes: true })).toBe(true)
  })

  it('rejects parvo dogs when accepts_parvo is not set', () => {
    expect(dogMatchesCriteria({ ...baseDog, parvo: true }, { accepts_parvo: false })).toBe(false)
    expect(dogMatchesCriteria({ ...baseDog, parvo: true }, { accepts_parvo: true })).toBe(true)
  })

  it('rejects special-needs dogs when the corresponding acceptance is not set', () => {
    expect(dogMatchesCriteria({ ...baseDog, tripod: true }, {})).toBe(false)
    expect(dogMatchesCriteria({ ...baseDog, blind: true }, {})).toBe(false)
    expect(dogMatchesCriteria({ ...baseDog, other_issues: true }, {})).toBe(false)
    expect(
      dogMatchesCriteria(
        { ...baseDog, tripod: true, blind: true, other_issues: true },
        { accepts_tripod: true, accepts_blind: true, accepts_other: true },
      ),
    ).toBe(true)
  })

  it('rejects on state mismatch and matches case-insensitively', () => {
    expect(dogMatchesCriteria(baseDog, { states_served: ['NY'] })).toBe(false)
    expect(dogMatchesCriteria(baseDog, { states_served: ['pa'] })).toBe(true)
  })

  it('treats missing dog fields as wildcards', () => {
    const sparseDog = { breed: 'Labrador' }
    expect(dogMatchesCriteria(sparseDog, { colors: ['black'], age_ranges: ['adult'] })).toBe(true)
  })
})
