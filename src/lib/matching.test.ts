import assert from 'node:assert/strict'
import { dogMatchesCriteria, dogAgeRange, dogSizeClass } from './matching'

// age/size classifiers
assert.equal(dogAgeRange(0.5), 'puppy')
assert.equal(dogAgeRange(1.5), 'youth')
assert.equal(dogAgeRange(5),   'adult')
assert.equal(dogAgeRange(10),  'senior')

assert.equal(dogSizeClass(15),  'xsmall')
assert.equal(dogSizeClass(25),  'small')
assert.equal(dogSizeClass(40),  'medium')
assert.equal(dogSizeClass(60),  'large')
assert.equal(dogSizeClass(100), 'xlarge')

const baseDog = {
  breed: 'Labrador', color: ['black'], age_years: 3, weight_lbs: 55,
  sex: 'male', mix: false, state: 'PA',
  parvo: false, tripod: false, blind: false, other_issues: false,
}

// clear match — criteria accepts everything
assert.equal(dogMatchesCriteria(baseDog, {}), true)

// breed mismatch
assert.equal(dogMatchesCriteria(baseDog, { breeds: ['Poodle'] }), false)

// breed match (substring)
assert.equal(dogMatchesCriteria(baseDog, { breeds: ['labrador'] }), true)

// color mismatch
assert.equal(dogMatchesCriteria(baseDog, { colors: ['white'] }), false)

// age range mismatch (criteria wants puppy, dog is adult)
assert.equal(dogMatchesCriteria(baseDog, { age_ranges: ['puppy'] }), false)

// size class mismatch (dog is 55 lbs = large, criteria wants xsmall)
assert.equal(dogMatchesCriteria(baseDog, { size_classes: ['xsmall'] }), false)

// sex mismatch
assert.equal(dogMatchesCriteria(baseDog, { sex_preference: 'female' }), false)

// sex_preference 'any' always passes
assert.equal(dogMatchesCriteria(baseDog, { sex_preference: 'any' }), true)

// mix rejection
assert.equal(dogMatchesCriteria({ ...baseDog, mix: true }, { accepts_mixes: false }), false)

// special needs rejection
assert.equal(dogMatchesCriteria({ ...baseDog, parvo: true }, { accepts_parvo: false }), false)
assert.equal(dogMatchesCriteria({ ...baseDog, parvo: true }, { accepts_parvo: true }),  true)

// state mismatch
assert.equal(dogMatchesCriteria(baseDog, { states_served: ['NY'] }), false)

// state match (case-insensitive)
assert.equal(dogMatchesCriteria(baseDog, { states_served: ['pa'] }), true)

console.log('matching: all assertions passed')
