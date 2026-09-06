import { HelpPanel } from '../../components/HelpPanel'
import { WhatsAppLink } from '../../components/WhatsAppLink'

const TITLES = [
  '¿Cómo elijo el tipo de sesión?',
  '¿Cómo elijo la fecha?',
  '¿Por qué no aparecen todas las horas?',
  '¿Para qué necesitas mis datos?',
  '¿Cómo hago el pago y qué pasa después?',
]

/** Help text for the step the patient is on, written for someone booking their
 *  first session — not a summary of the whole flow at every step. */
export function BookingHelp({ step }: { step: number }) {
  return (
    <HelpPanel title={TITLES[step] ?? '¿Necesitas ayuda?'}>
      {step === 0 && (
        <>
          <p>
            Elige <strong>Individual</strong> si la sesión es solo para ti, o{' '}
            <strong>Pareja / Familia</strong> si asistirá más de una persona.
            Cada opción muestra su duración y su precio.
          </p>
          <p>
            Todas las sesiones son <strong>virtuales</strong>. Si no estás
            segura de cuál te corresponde, escríbele a Orlandia por WhatsApp
            al <WhatsAppLink /> antes de reservar.
          </p>
        </>
      )}

      {step === 1 && (
        <>
          <p>
            El calendario solo muestra los días en que Orlandia atiende. Si un
            día no aparece, es porque no hay consulta ese día, está bloqueado
            por vacaciones o feriado, o ya pasó.
          </p>
          <p>
            Puedes reservar con varias semanas de anticipación. El día de hoy
            aparece solo si todavía queda alguna hora libre.
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <p>
            Puedes reservar <strong>1, 2 o 3 sesiones corridas</strong> en la
            misma solicitud. Cada cupo dura 50 minutos. El total es el precio
            de la sesión por la cantidad de cupos. No hace falta hacer varias
            citas.
          </p>
          <p>
            Las sesiones corridas son del mismo bloque: mañana (9, 10 y 11) o
            tarde (2, 3 y 4). No se pueden unir las 11:00 con las 2:00.
          </p>
          <p>
            Ves únicamente las horas de inicio en las que <strong>todo</strong>{' '}
            el bloque sigue libre. Una hora no aparece si alguien ya la
            reservó o si ya pasó (si elegiste hoy).
          </p>
        </>
      )}

      {step === 3 && (
        <>
          <p>
            El <strong>nombre y el teléfono</strong> son para que Orlandia
            pueda identificarte y escribirte por WhatsApp. El correo es
            opcional. Nadie más ve estos datos.
          </p>
          <p>
            El campo de notas es opcional. Puedes usarlo para contarle algo
            breve antes de la sesión, pero no hace falta.
          </p>
        </>
      )}

      {step === 4 && (
        <>
          <p>
            <strong>1. Transfiere el total</strong> que aparece arriba a
            cualquiera de las cuentas. Si reservaste más de una hora, es un
            solo pago por el bloque completo. Elige el banco que te quede más
            cómodo y la moneda que vayas a usar.
          </p>
          <p>
            La <strong>cédula</strong> que aparece junto a cada cuenta es la de
            la titular. En República Dominicana los bancos la piden para
            completar transferencias entre bancos distintos, así que tenla a
            mano si transfieres desde otro banco.
          </p>
          <p>
            <strong>2. Sube el comprobante</strong> de la transferencia. Es
            obligatorio: sin él no se puede enviar la solicitud. Sirve una
            captura de pantalla.
          </p>
          <p>
            <strong>3. Al enviar</strong>, tu cita queda{' '}
            <strong>pendiente de confirmación</strong> y verás un{' '}
            <strong>código de seguimiento</strong> que empieza con{' '}
            <strong>BI-</strong>. Guárdalo: es la única forma de consultar tu
            cita después, y solo tú lo tienes.
          </p>
          <p>
            Orlandia revisa el comprobante de transferencia y confirma la
            cita. Si después quieres un <strong>comprobante de servicio en
            PDF</strong> (para tu contabilidad; no es el de la transferencia
            ni una factura fiscal), puedes pedirlo en la pantalla de
            confirmación o en <strong>Mis citas</strong>.
            Antes de la sesión te escribe por WhatsApp para que confirmes tu
            asistencia.
            No hace falta esperar ese mensaje: puedes consultar el estado y
            confirmar tú misma en <strong>Mis citas</strong> con tu código.
          </p>
          <p>
            <strong>¿Necesitas cambiar la fecha después?</strong> Puedes
            hacerlo tú misma desde <strong>Mis citas</strong>, hasta 24 horas
            antes de la sesión y como máximo dos veces. Más cerca de la hora, o
            si necesitas cancelar, escríbele a Orlandia por WhatsApp al{' '}
            <WhatsAppLink /> con tu código.
          </p>
        </>
      )}
    </HelpPanel>
  )
}
