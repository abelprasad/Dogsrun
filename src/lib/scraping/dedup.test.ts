import { describe, expect, it } from 'vitest'
import {
  dedupeExact,
  exactDuplicateKey,
  findFuzzyCandidates,
  isExactDuplicate,
  type ExistingDogRef,
} from './dedup'

describe('exactDuplicateKey', () => {
  it('is case-insensitive and trims', () => {
    expect(exactDuplicateKey('acct-shelterluv', 'ACCT-A-1')).toBe(
      exactDuplicateKey('ACCT-SHELTERLUV', '  acct-a-1 '),
    )
    expect(exactDuplicateKey('acct-shelterluv', 'ACCT-A-1')).not.toBe(
      exactDuplicateKey('acct-shelterluv', 'ACCT-A-2'),
    )
    expect(exactDuplicateKey('acct-shelterluv', 'ACCT-A-1')).not.toBe(
      exactDuplicateKey('petfinder-api', 'ACCT-A-1'),
    )
  })
})

describe('isExactDuplicate', () => {
  it('matches only on same source + same source ID', () => {
    const a = { source: 'acct-shelterluv', sourceId: 'ACCT-A-1' }
    expect(isExactDuplicate(a, { source: 'acct-shelterluv', sourceId: 'ACCT-A-1' })).toBe(true)
    expect(isExactDuplicate(a, { source: 'acct-shelterluv', sourceId: 'ACCT-A-2' })).toBe(false)
    // Same dog on another source is NOT an exact duplicate (no universal ID).
    expect(isExactDuplicate(a, { source: 'petfinder-api', sourceId: 'ACCT-A-1' })).toBe(false)
  })
})

describe('dedupeExact', () => {
  it('keeps the first row and reports later repeats as duplicates', () => {
    const dogs = [
      { source: 'acct-shelterluv', sourceId: 'ACCT-A-1', name: 'One' },
      { source: 'acct-shelterluv', sourceId: 'ACCT-A-2', name: 'Two' },
      { source: 'acct-shelterluv', sourceId: 'ACCT-A-1', name: 'One again' },
    ]
    const { unique, duplicates } = dedupeExact(dogs)
    expect(unique).toHaveLength(2)
    expect(duplicates).toEqual([{ source: 'acct-shelterluv', sourceId: 'ACCT-A-1', name: 'One again' }])
  })
})

describe('findFuzzyCandidates', () => {
  const scraped = {
    name: 'Mellonade',
    breed: 'Mixed Breed',
    sex: 'female' as const,
    ageYears: 5.05,
    photoUrls: ['https://example.com/1.jpg'],
    shelterId: 'acct',
  }
  const existing: ExistingDogRef = {
    id: 'dog-1',
    shelterId: 'acct',
    name: 'mellonade ',
    breed: 'Mixed Breed (Medium)',
    sex: 'Female',
    ageYears: 5.0,
    photoUrls: ['https://example.com/1.jpg'],
  }

  it('flags a same-shelter name+breed+sex+age match (human-only)', () => {
    const candidates = findFuzzyCandidates(scraped, [existing])
    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toEqual({
      existingId: 'dog-1',
      reason: 'name+breed+sex match, age within 0.5y, photo overlap',
      photoOverlap: true,
    })
  })

  it('flags a match without photo overlap', () => {
    const candidates = findFuzzyCandidates(scraped, [
      { ...existing, id: 'dog-2', photoUrls: ['https://example.com/other.jpg'] },
    ])
    expect(candidates).toHaveLength(1)
    expect(candidates[0].photoOverlap).toBe(false)
    expect(candidates[0].reason).toBe('name+breed+sex match, age within 0.5y')
  })

  it('rejects age differences over 0.5 years', () => {
    expect(findFuzzyCandidates(scraped, [{ ...existing, ageYears: 5.6 }])).toHaveLength(0)
    expect(findFuzzyCandidates(scraped, [{ ...existing, ageYears: 4.55 }])).toHaveLength(1)
  })

  it('does not exclude a candidate when one age is unknown', () => {
    expect(findFuzzyCandidates(scraped, [{ ...existing, ageYears: null }])).toHaveLength(1)
    expect(findFuzzyCandidates({ ...scraped, ageYears: null }, [existing])).toHaveLength(1)
  })

  it('rejects mismatches on sex, breed, name, and shelter', () => {
    expect(findFuzzyCandidates(scraped, [{ ...existing, sex: 'Male' }])).toHaveLength(0)
    expect(findFuzzyCandidates(scraped, [{ ...existing, breed: 'Poodle' }])).toHaveLength(0)
    expect(findFuzzyCandidates(scraped, [{ ...existing, name: 'Other' }])).toHaveLength(0)
    expect(findFuzzyCandidates(scraped, [{ ...existing, shelterId: 'pspca' }])).toHaveLength(0)
  })

  it('never yields a candidate when sex is unknown (exact dedup still applies)', () => {
    expect(findFuzzyCandidates({ ...scraped, sex: 'unknown' }, [existing])).toHaveLength(0)
    expect(findFuzzyCandidates(scraped, [{ ...existing, sex: 'Unknown' }])).toHaveLength(0)
    expect(findFuzzyCandidates({ ...scraped, name: '' }, [existing])).toHaveLength(0)
  })

  it('does not merge: it only returns flags and never mutates its inputs', () => {
    const before = JSON.stringify({ scraped, existing })
    const candidates = findFuzzyCandidates(scraped, [existing])
    expect(candidates).toHaveLength(1)
    expect(JSON.stringify({ scraped, existing })).toBe(before)
    // The candidate carries no merge instruction — a human decides.
    expect(Object.keys(candidates[0]).sort()).toEqual([
      'existingId',
      'photoOverlap',
      'reason',
    ])
  })
})
