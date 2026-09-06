/** Digits only, with the Dominican +1 country code when the number is local. */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('1') && digits.length >= 11) return digits
  if (digits.length === 10) return `1${digits}`
  return digits
}

export function hasPhone(phone: string): boolean {
  return toWhatsAppNumber(phone).length >= 11
}
