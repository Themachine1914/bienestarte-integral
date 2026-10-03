import { HelpPanel } from '../../components/HelpPanel'

/** Guide for the patient record: history, rebooking and sending receipts. */
export function PatientsHelp() {
  return (
    <HelpPanel title="Cómo funciona esta página" tone="lavender">
      <div>
        <p className="font-medium text-ink">De dónde salen los pacientes</p>
        <p className="mt-1">
          No hace falta crearlos a mano. Cada vez que alguien agenda — desde la
          web o tú desde <strong>Nueva cita</strong> — el sistema lo busca por
          teléfono o correo. Si ya existe, la cita se suma a su expediente; si
          no, se crea uno nuevo.
        </p>
        <p className="mt-1">
          Usa el buscador para encontrarlo por nombre, teléfono o correo. En la
          lista ves cuántas citas tiene y la fecha de su última sesión.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">El expediente</p>
        <p className="mt-1">
          Al abrir un paciente verás un resumen: <strong>sesiones
          realizadas</strong> (las que marcaste como completadas),{' '}
          <strong>próximas</strong>, <strong>canceladas o rechazadas</strong> y
          el <strong>total facturado</strong>, que suma solo las citas
          confirmadas y completadas. Debajo está el historial completo, de la
          más reciente a la más antigua, con el estado y el código de cada
          cita.
        </p>
        <p className="mt-1">
          Las <strong>notas privadas</strong> solo las ves tú. El paciente
          nunca tiene acceso a ellas.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Agendarle una cita nueva</p>
        <p className="mt-1">
          El botón <strong>Agendar nueva cita</strong> abre el mismo formulario
          de <strong>Citas</strong>, pero ya con su nombre, teléfono y correo
          llenos, y con el tipo de sesión que tuvo la última vez. Solo eliges
          fecha y hora. La cita queda <strong>confirmada</strong> de una vez,
          igual que cuando la creas desde Citas.
        </p>
        <p className="mt-1">
          También puedes marcar <strong>Fuera del horario habitual</strong>{' '}
          para darle un día u hora que no está abierto en la web.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Enviarle el comprobante</p>
        <p className="mt-1">
          Al crear la cita aparece un recuadro verde con los botones para
          mandarle el comprobante en ese momento. Además, cada cita confirmada
          o completada del historial tiene los mismos tres botones:
        </p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>
            <strong>Ver comprobante</strong>: abre el comprobante con el sello
            para imprimirlo o guardarlo en PDF, por si prefieres adjuntarlo tú.
          </li>
          <li>
            <strong>Enviar por WhatsApp</strong>: abre el chat del paciente con
            un mensaje ya escrito que trae la fecha, su código y un enlace a su
            comprobante. Solo pulsas enviar.
          </li>
          <li>
            <strong>Enviar por email</strong>: abre tu correo con el mismo
            mensaje. Aparece solo si el paciente dejó correo.
          </li>
        </ul>
        <p className="mt-1">
          Nada se envía solo: si no pulsas enviar en WhatsApp o en el correo,
          al paciente no le llega nada. Las citas pendientes, rechazadas o
          canceladas no tienen comprobante.
        </p>
      </div>
    </HelpPanel>
  )
}
