import { describe, expect, it } from 'vitest'
import {
  cleanDescription,
  extractSourceIdFromUrl,
  normalizeScrapedDog,
  parseAgeYears,
  parseBirthdayAge,
  parseBreed,
  parseSex,
  parseWeightLbs,
} from './normalize'
import {
  detectBlock,
  extractShelterId,
  findNextPageUrl,
  mapShelterluvAnimal,
  parseShelterluvDetailHtml,
  parseShelterluvListHtml,
} from './adapters/acct'

describe('parseAgeYears', () => {
  it('parses the plan cases', () => {
    expect(parseAgeYears('2 years')).toBe(2)
    expect(parseAgeYears('6 months')).toBe(0.5)
    expect(parseAgeYears('8 weeks')).toBe(0.15)
    expect(parseAgeYears('not an age')).toBeNull()
  })

  it('parses Shelterluv compact ages (5Y/8M/1W)', () => {
    expect(parseAgeYears('5Y/8M/1W')).toBe(5.69)
    expect(parseAgeYears('5Y/0M/2W')).toBe(5.04)
  })

  it('parses multi-part ages', () => {
    expect(parseAgeYears('1 year 7 months')).toBe(1.58)
    expect(parseAgeYears('3 yrs 11 mos')).toBe(3.92)
    expect(parseAgeYears('10 yr 8 months')).toBe(10.67)
  })

  it('returns null for missing/unknown ages', () => {
    expect(parseAgeYears(null)).toBeNull()
    expect(parseAgeYears(undefined)).toBeNull()
    expect(parseAgeYears('')).toBeNull()
    expect(parseAgeYears('Unknown')).toBeNull()
    expect(parseAgeYears('Not Available')).toBeNull()
  })

  it('treats a bare number as years', () => {
    expect(parseAgeYears('2')).toBe(2)
    expect(parseAgeYears(3)).toBe(3)
  })
})

describe('parseBirthdayAge', () => {
  it('derives age from a unix birthday in seconds', () => {
    const nowMs = Date.UTC(2026, 10, 11)
    const twoYearsAgoSec = Math.floor(nowMs / 1000) - Math.floor(2 * 365.25 * 24 * 3600)
    expect(parseBirthdayAge(String(twoYearsAgoSec), nowMs)).toBe(2)
  })

  it('accepts milliseconds and rejects future birthdays', () => {
    const nowMs = Date.UTC(2026, 10, 11)
    expect(parseBirthdayAge(nowMs - 365.25 * 24 * 3600 * 1000, nowMs)).toBe(1)
    expect(parseBirthdayAge(nowMs + 1000, nowMs)).toBeNull()
    expect(parseBirthdayAge(null, nowMs)).toBeNull()
  })
})

describe('parseSex', () => {
  it('maps male/female/unknown only', () => {
    expect(parseSex('Male')).toBe('male')
    expect(parseSex('Female')).toBe('female')
    expect(parseSex('Unknown')).toBe('unknown')
    expect(parseSex('Neutered Male')).toBe('unknown')
    expect(parseSex(null)).toBe('unknown')
    expect(parseSex('')).toBe('unknown')
  })
})

describe('parseBreed', () => {
  it('marks Mixed Breed as a mix and keeps the base breed', () => {
    expect(parseBreed('Mixed Breed (Medium)')).toEqual({ breed: 'Mixed Breed', mix: true })
    expect(parseBreed('Mixed Breed')).toEqual({ breed: 'Mixed Breed', mix: true })
  })

  it('strips a trailing Mix word and keeps the base breed', () => {
    expect(parseBreed('Labrador Retriever Mix')).toEqual({
      breed: 'Labrador Retriever',
      mix: true,
    })
  })

  it('handles the slash form and size suffixes', () => {
    expect(parseBreed('Terrier, American Staffordshire/Mixed Breed (Medium)')).toEqual({
      breed: 'Terrier, American Staffordshire',
      mix: true,
    })
  })

  it('leaves plain breeds alone and reads a Mix secondary breed', () => {
    expect(parseBreed('German Shepherd Dog')).toEqual({ breed: 'German Shepherd Dog', mix: false })
    expect(parseBreed('Pit Bull Terrier', 'Mix')).toEqual({
      breed: 'Pit Bull Terrier',
      mix: true,
    })
    expect(parseBreed('')).toEqual({ breed: 'Unknown', mix: false })
  })
})

describe('parseWeightLbs', () => {
  it('parses pounds', () => {
    expect(parseWeightLbs('40 lbs')).toBe(40)
    expect(parseWeightLbs('63.4 lbs')).toBe(63.4)
    expect(parseWeightLbs(55)).toBe(55)
    expect(parseWeightLbs(null)).toBeNull()
    expect(parseWeightLbs('')).toBeNull()
  })
})

describe('cleanDescription', () => {
  it('strips HTML, decodes entities, and caps at 2,000 chars', () => {
    expect(cleanDescription('<p>Very <b>sweet</b> girl &amp; friendly.</p>')).toBe(
      'Very sweet girl & friendly.',
    )
    expect(cleanDescription('  spaced   out  ')).toBe('spaced out')
    expect(cleanDescription('x'.repeat(2500)).length).toBe(2000)
    expect(cleanDescription(null)).toBe('')
  })
})

describe('extractSourceIdFromUrl', () => {
  it('pulls ACCT-A-* IDs out of embed URLs', () => {
    expect(extractSourceIdFromUrl('https://www.shelterluv.com/embed/animal/ACCT-A-235558')).toBe(
      'ACCT-A-235558',
    )
    expect(extractSourceIdFromUrl('https://example.com/no-id')).toBeNull()
  })
})

describe('normalizeScrapedDog', () => {
  const base = {
    source: 'acct-shelterluv',
    sourceId: 'ACCT-A-235558',
    sourceUrl: 'https://www.shelterluv.com/embed/animal/ACCT-A-235558',
    name: 'Mellonade',
    breed: 'Mixed Breed (Medium)',
    ageYears: 5.04,
    weightLbs: '40 lbs',
    sex: 'Female',
    color: ['Grey', 'White', 'Grey'],
    description: '<p>Sweet girl.</p>',
    photoUrls: ['https://example.com/1.jpg', 'https://example.com/1.jpg'],
  }

  it('normalizes a full record', () => {
    const dog = normalizeScrapedDog(base)
    expect(dog).toMatchObject({
      source: 'acct-shelterluv',
      sourceId: 'ACCT-A-235558',
      name: 'Mellonade',
      breed: 'Mixed Breed',
      mix: true,
      ageYears: 5.04,
      weightLbs: 40,
      sex: 'female',
      color: ['Grey', 'White'],
      description: 'Sweet girl.',
      photoUrls: ['https://example.com/1.jpg'],
      status: 'available',
    })
  })

  it('returns null for a nameless dog (not importable)', () => {
    expect(normalizeScrapedDog({ ...base, name: '   ' })).toBeNull()
    expect(normalizeScrapedDog({ ...base, name: null })).toBeNull()
  })

  it('derives age from birthday when ageYears is absent', () => {
    const nowMs = Date.UTC(2026, 10, 11)
    const realNow = Date.now
    Date.now = () => nowMs
    try {
      const birthdaySec = Math.floor(nowMs / 1000) - Math.floor(3 * 365.25 * 24 * 3600)
      const dog = normalizeScrapedDog({ ...base, ageYears: null, birthday: String(birthdaySec) })
      expect(dog?.ageYears).toBe(3)
    } finally {
      Date.now = realNow
    }
  })
})

describe('mapShelterluvAnimal', () => {
  const twoYearsAgoSec = Math.floor(Date.now() / 1000) - Math.floor(2 * 365.25 * 24 * 3600)
  const rawDog = {
    nid: 212104997,
    name: 'Mellonade',
    uniqueId: 'ACCT-A-235558',
    sex: 'Female',
    location: '',
    weight: 40,
    weight_units: 'lbs',
    birthday: String(twoYearsAgoSec),
    species: 'Dog',
    breed: 'Mixed Breed (Medium)',
    secondary_breed: '',
    primary_color: 'Grey',
    secondary_color: 'White',
    attributes: ['Lived with Cats'],
    photos: {
      '0': {
        id: 1,
        name: 'a.jpg',
        url: 'https://new-s3.shelterluv.com/profile-pictures/aaa/1.jpg',
        isCover: false,
        order_column: 2,
      },
      '1': {
        id: 2,
        name: 'b.jpg',
        url: 'https://new-s3.shelterluv.com/profile-pictures/bbb/2.jpg',
        isCover: true,
        order_column: 8,
      },
    },
    intake_date: null,
    campus: 'Main Campus',
    public_url: 'https://www.shelterluv.com/embed/animal/ACCT-A-235558',
    adoptable: 0,
    kennel_description: '<p>Very sweet girl.</p>',
    adoptionFee: '$100.00',
  }

  it('maps a list-endpoint record (keyed photos object)', () => {
    const dog = mapShelterluvAnimal(rawDog)
    expect(dog).toMatchObject({
      source: 'acct-shelterluv',
      sourceId: 'ACCT-A-235558',
      name: 'Mellonade',
      breed: 'Mixed Breed',
      mix: true,
      ageYears: 2,
      weightLbs: 40,
      sex: 'female',
      color: ['Grey', 'White'],
      description: 'Very sweet girl.',
      status: 'available',
    })
    // Cover photo first, then order_column.
    expect(dog?.photoUrls).toEqual([
      'https://new-s3.shelterluv.com/profile-pictures/bbb/2.jpg',
      'https://new-s3.shelterluv.com/profile-pictures/aaa/1.jpg',
    ])
  })

  it('rejects non-dogs, non-ACCT IDs, and nameless rows', () => {
    expect(mapShelterluvAnimal({ ...rawDog, species: 'Cat' })).toBeNull()
    expect(mapShelterluvAnimal({ ...rawDog, uniqueId: 'SHMN-A-0' })).toBeNull()
    expect(mapShelterluvAnimal({ ...rawDog, name: '' })).toBeNull()
    expect(mapShelterluvAnimal(null)).toBeNull()
  })
})

// Fixture modeled on the real server-rendered Shelterluv detail shell
// (verified live Nov 11, 2026): full record as JSON in an `:animal`
// attribute, `window.shelterId = 13458`.
const DETAIL_FIXTURE_HTML = `<!DOCTYPE html>
<html><head><title>Mellonade is available for adoption at ACCT Philly</title></head>
<body><div id="app"><iframe-animal
  :animal="{&quot;nid&quot;:212104997,&quot;name&quot;:&quot;Mellonade&quot;,&quot;uniqueId&quot;:&quot;ACCT-A-235558&quot;,&quot;sex&quot;:&quot;Female&quot;,&quot;location&quot;:&quot;&quot;,&quot;weight&quot;:40,&quot;weight_units&quot;:&quot;lbs&quot;,&quot;birthday&quot;:&quot;1635134400&quot;,&quot;species&quot;:&quot;Dog&quot;,&quot;breed&quot;:&quot;Mixed Breed (Medium)&quot;,&quot;secondary_breed&quot;:&quot;&quot;,&quot;primary_color&quot;:&quot;Grey&quot;,&quot;secondary_color&quot;:&quot;White&quot;,&quot;attributes&quot;:[&quot;Lived with Cats&quot;],&quot;photos&quot;:[{&quot;id&quot;:1,&quot;name&quot;:&quot;a.jpg&quot;,&quot;url&quot;:&quot;https:\\/\\/new-s3.shelterluv.com\\/profile-pictures\\/aaa\\/1.jpg&quot;,&quot;isCover&quot;:true,&quot;order_column&quot;:1}],&quot;intake_date&quot;:null,&quot;campus&quot;:&quot;Main Campus&quot;,&quot;public_url&quot;:&quot;https:\\/\\/www.shelterluv.com\\/embed\\/animal\\/ACCT-A-235558&quot;,&quot;adoptable&quot;:0,&quot;kennel_description&quot;:&quot;Very sweet girl.&quot;}"
  :show-adoption-link="true"
></iframe-animal></div>
<script>window.shelterId = 13458</script>
</body></html>`

const DETAIL_TEXT_FIXTURE_HTML = `<!DOCTYPE html>
<html><head><title>Rex is available for adoption at ACCT Philly</title></head>
<body>
<div>Item 1 of 14</div><h1>Rex</h1>
<div>ANIMAL ID</div><div>ACCT-A-333333</div>
<div>BREED</div><div>Labrador Retriever Mix</div>
<div>SEX</div><div>Male</div>
<div>WEIGHT</div><div>63.4 lbs</div>
<div>AGE</div><div>5Y/8M/1W</div>
<img src="https://new-s3.shelterluv.com/profile-pictures/abc/def.jpg">
</body></html>`

const LIST_FIXTURE_HTML = `<div class="animals">
  <a href="/embed/animal/ACCT-A-111111"><img src="https://example.com/p1.jpg" alt="Biscuit"><span>Biscuit</span></a>
  <a href="https://www.shelterluv.com/embed/animal/ACCT-A-222222"><img src="https://example.com/p2.jpg" alt="Gravy"><span>Gravy</span></a>
  <a href="/embed/animal/ACCT-A-111111"><img src="https://example.com/p1.jpg" alt="Biscuit"><span>Biscuit</span></a>
  <a href="/embed/animal/SHMN-A-0"><img src="/img/x.png" alt="Other"><span>Other</span></a>
</div>`

describe('parseShelterluvDetailHtml', () => {
  it('parses the server-rendered :animal JSON blob', () => {
    const dog = parseShelterluvDetailHtml(
      DETAIL_FIXTURE_HTML,
      'https://www.shelterluv.com/embed/animal/ACCT-A-235558',
    )
    expect(dog).toMatchObject({
      source: 'acct-shelterluv',
      sourceId: 'ACCT-A-235558',
      name: 'Mellonade',
      breed: 'Mixed Breed',
      mix: true,
      sex: 'female',
      weightLbs: 40,
      color: ['Grey', 'White'],
      description: 'Very sweet girl.',
      photoUrls: ['https://new-s3.shelterluv.com/profile-pictures/aaa/1.jpg'],
    })
    expect(typeof dog?.ageYears).toBe('number')
    expect(dog?.ageYears).toBeGreaterThan(0)
  })

  it('falls back to rendered label/value text when the JSON blob is absent', () => {
    const dog = parseShelterluvDetailHtml(
      DETAIL_TEXT_FIXTURE_HTML,
      'https://www.shelterluv.com/embed/animal/ACCT-A-333333',
    )
    expect(dog).toMatchObject({
      sourceId: 'ACCT-A-333333',
      name: 'Rex',
      breed: 'Labrador Retriever',
      mix: true,
      sex: 'male',
      weightLbs: 63.4,
      ageYears: 5.69,
      photoUrls: ['https://new-s3.shelterluv.com/profile-pictures/abc/def.jpg'],
    })
  })

  it('returns null for a non-ACCT detail page', () => {
    expect(
      parseShelterluvDetailHtml(
        DETAIL_TEXT_FIXTURE_HTML.replaceAll('ACCT-A-333333', 'SHMN-A-0'),
        'https://www.shelterluv.com/embed/animal/SHMN-A-0',
      ),
    ).toBeNull()
  })
})

describe('parseShelterluvListHtml', () => {
  it('extracts ACCT entries, dedupes repeats, ignores other shelters', () => {
    const entries = parseShelterluvListHtml(LIST_FIXTURE_HTML)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      sourceId: 'ACCT-A-111111',
      sourceUrl: 'https://www.shelterluv.com/embed/animal/ACCT-A-111111',
      name: 'Biscuit',
      photoUrl: 'https://example.com/p1.jpg',
    })
    expect(entries[1].sourceId).toBe('ACCT-A-222222')
    expect(entries[1].name).toBe('Gravy')
  })
})

describe('extractShelterId', () => {
  it('reads window.shelterId from the embed shell', () => {
    expect(extractShelterId(DETAIL_FIXTURE_HTML)).toBe(13458)
    expect(extractShelterId('<html></html>')).toBeNull()
  })
})

describe('findNextPageUrl', () => {
  it('follows rel=next and returns null when there is none', () => {
    const html =
      '<a rel="next" href="/embed/animal/list?page=2">Next</a><a href="/x">1</a>'
    expect(findNextPageUrl(html, 'https://www.shelterluv.com/embed/animal/list')).toBe(
      'https://www.shelterluv.com/embed/animal/list?page=2',
    )
    expect(findNextPageUrl('<div>no pages</div>', 'https://www.shelterluv.com/embed/animal/list')).toBeNull()
  })
})

describe('detectBlock', () => {
  it('flags 403/429/CAPTCHA and passes normal pages', () => {
    expect(detectBlock('<html></html>', 403)).toBe('http-403')
    expect(detectBlock('<html></html>', 429)).toBe('http-429')
    expect(
      detectBlock('<body><p>Please verify you are human to continue</p></body>', 200),
    ).toBe('captcha')
    expect(
      detectBlock(
        '<body><h1>Just a moment</h1><p>Checking your browser — Cloudflare Ray ID 1</p></body>',
        200,
      ),
    ).toBe('bot-challenge')
    expect(detectBlock('<body><h1>Dogs</h1></body>', 200)).toBeNull()
  })
})
