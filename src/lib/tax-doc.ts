// Convention shared by the registration page (upload) and /api/register (validation):
// a user's 501(c)(3) document lives at `<user id>/501c3.pdf` in the tax-docs bucket.

export function taxDocPath(userId: string): string {
  return `${userId}/501c3.pdf`
}

/** True when `path` is inside the user's own folder. */
export function isOwnTaxDocPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`)
}
