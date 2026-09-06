import {
  PRACTICE_WHATSAPP_DISPLAY,
  PRACTICE_WHATSAPP_URL,
} from '../lib/defaults'

export function WhatsAppLink() {
  return (
    <a
      href={PRACTICE_WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-sage-700 underline underline-offset-2 hover:text-sage-800"
    >
      {PRACTICE_WHATSAPP_DISPLAY}
    </a>
  )
}
