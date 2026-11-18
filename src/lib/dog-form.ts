// Shared by the new-dog and edit-dog forms: field shape, validation and the
// empty-string -> null normalization of optional fields.

export interface DogFormValues {
  name: string
  breed: string
  mix: boolean
  age_years: string
  weight_lbs: string
  sex: string
  color: string[]
  state: string
  description: string
  parvo: boolean
  tripod: boolean
  blind: boolean
  other_issues: boolean
  other_issues_notes: string
  intake_date: string
  euthanasia_date: string
}

export interface DogFormErrors {
  age_years?: string
  weight_lbs?: string
}

/** First validation error for the form, or null when it is valid. */
export function validateDogForm(form: DogFormValues): DogFormErrors | null {
  if (form.age_years !== '' && parseFloat(form.age_years) < 0) return { age_years: 'Age cannot be negative' }
  if (form.weight_lbs !== '' && parseFloat(form.weight_lbs) < 0) return { weight_lbs: 'Weight cannot be negative' }
  return null
}

/** Optional fields as the API/DB expect them: empty values become null. */
export function normalizedOptionalFields(form: DogFormValues) {
  return {
    color: form.color.length > 0 ? form.color : null,
    state: form.state || null,
    intake_date: form.intake_date || null,
    euthanasia_date: form.euthanasia_date || null,
  }
}
