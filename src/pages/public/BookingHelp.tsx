import { HelpPanel } from '../../components/HelpPanel'

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
            segura de cuál te corresponde, escríbele a Orlandia por Instagram
            antes de reservar.
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
            Ves únicamente las horas que siguen libres. Una hora{' '}
            <strong>no aparece</strong> por dos razones: alguien ya la reservó,
            o ya pasó (si elegiste hoy).
          </p>
          <p>
            Los cupos se toman por orden de llegada y son pocos al día. Puede
            ocurrir que alguien reserve tu hora mientras completas el
            formulario; si pasa, te avisamos al final y podrás elegir otra.
            Nadie pierde su cupo por eso.
          </p>
        </>
      )}

      {step === 3 && (
        <>
          <p>
            El <strong>nombre, teléfono y correo</strong> son para que Orlandia
            pueda identificarte y contactarte sobre tu cita. Nadie más ve estos
            datos.
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
            <strong>1. Transfiere el monto</strong> a cualquiera de las cuentas
            que aparecen arriba. Elige la del banco que te quede más cómodo y
            la moneda que vayas a usar.
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
            Orlandia revisa el comprobante y confirma la cita. Como no se envían
            correos automáticos, consulta el estado tú misma en{' '}
            <strong>Mis citas</strong> con tu código.
          </p>
          <p>
            <strong>¿Necesitas cambiar la fecha después?</strong> Puedes
            hacerlo tú misma desde <strong>Mis citas</strong>, hasta 24 horas
            antes de la sesión y como máximo dos veces. Más cerca de la hora, o
            si necesitas cancelar, escríbele a Orlandia por Instagram con tu
            código.
          </p>
        </>
      )}
    </HelpPanel>
  )
}
