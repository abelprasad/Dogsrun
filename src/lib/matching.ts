export function dogAgeRange(age: number): string {
  if (age < 1) return 'puppy'
  if (age < 2) return 'youth'
  if (age < 8) return 'adult'
  return 'senior'
}

export function dogSizeClass(weight: number): string {
  if (weight < 20) return 'xsmall'
  if (weight < 30) return 'small'
  if (weight < 50) return 'medium'
  if (weight < 90) return 'large'
  return 'xlarge'
}

interface MatchDog {
  breed?: string | null
  color?: string[] | null
  age_years?: number | null
  weight_lbs?: number | null
  sex?: string | null
  mix?: boolean | null
  state?: string | null
  parvo?: boolean | null
  tripod?: boolean | null
  blind?: boolean | null
  other_issues?: boolean | null
}

interface MatchCriteria {
  breeds?: string[] | null
  colors?: string[] | null
  age_ranges?: string[] | null
  size_classes?: string[] | null
  sex_preference?: string | null
  accepts_mixes?: boolean | null
  states_served?: string[] | null
  accepts_parvo?: boolean | null
  accepts_tripod?: boolean | null
  accepts_blind?: boolean | null
  accepts_other?: boolean | null
}

export function dogMatchesCriteria(dog: MatchDog, criteria: MatchCriteria): boolean {
  if (dog.parvo && !criteria.accepts_parvo) return false
  if (dog.tripod && !criteria.accepts_tripod) return false
  if (dog.blind && !criteria.accepts_blind) return false
  if (dog.other_issues && !criteria.accepts_other) return false

  const breedMatch = !criteria.breeds || criteria.breeds.length === 0 ||
    criteria.breeds.some(b => dog.breed?.toLowerCase().includes(b.toLowerCase()))

  const colorMatch = !criteria.colors || criteria.colors.length === 0 ||
    !dog.color || dog.color.length === 0 ||
    dog.color.some(c => criteria.colors!.some(cc => cc.toLowerCase() === c.toLowerCase()))

  const ageMatch = !criteria.age_ranges || criteria.age_ranges.length === 0 ||
    !dog.age_years || criteria.age_ranges.includes(dogAgeRange(dog.age_years))

  const weightMatch = !criteria.size_classes || criteria.size_classes.length === 0 ||
    !dog.weight_lbs || criteria.size_classes.includes(dogSizeClass(dog.weight_lbs))

  const sexMatch = !criteria.sex_preference ||
    criteria.sex_preference === 'any' ||
    criteria.sex_preference === dog.sex

  const mixMatch = dog.mix ? criteria.accepts_mixes !== false : true

  const stateMatch = !criteria.states_served || criteria.states_served.length === 0 ||
    !dog.state ||
    criteria.states_served.some(s => s.toUpperCase() === dog.state?.toUpperCase())

  return breedMatch && colorMatch && ageMatch && weightMatch && sexMatch && mixMatch && stateMatch
}
