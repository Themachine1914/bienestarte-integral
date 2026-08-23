import { HelpPanel } from '../../components/HelpPanel'

/** Guide for the practice owner. Describes what the buttons on this page
 *  actually do to a slot, since that is the part with lasting consequences. */
export function AppointmentsHelp() {
  return (
    <HelpPanel title="Cómo funciona esta página" tone="lavender">
      <div>
        <p className="font-medium text-ink">Ver el detalle de una cita</p>
        <p className="mt-1">
          Cada tarjeta muestra todo lo de esa cita: nombre del paciente, correo
          y teléfono, la fecha y hora, el tipo de sesión y el monto. Si el
          paciente escribió una nota al reservar, aparece debajo. A la derecha
          verás una etiqueta de color con el estado actual.
        </p>
        <p className="mt-1">
          El botón <strong>Ver comprobante</strong> abre en otra pestaña la
          imagen de la transferencia que subió el paciente. El{' '}
          <strong>código del paciente</strong> (empieza con BI-) es el mismo que
          él usa para consultar su cita; si te escribe con ese código, así lo
          ubicas.
        </p>
        <p className="mt-1">
          Los botones de arriba filtran la lista por estado. Son solo un filtro
          de vista: no cambian nada.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">
          Cambiar el estado y qué le pasa al cupo
        </p>
        <p className="mt-1">
          Esta es la parte importante. Cada cita ocupa un cupo en su fecha y
          hora, y el estado decide si ese cupo sigue reservado o vuelve a
          quedar libre para otro paciente.
        </p>
        <ul className="mt-2 space-y-1.5">
          <li>
            <strong>Confirmar</strong> (desde pendiente): aceptas la cita. El
            cupo <strong>sigue ocupado</strong> y se descarga solo el archivo
            de calendario <code className="text-xs">.ics</code> para que la
            agregues a tu iPhone.
          </li>
          <li>
            <strong>Rechazar</strong> (desde pendiente): no aceptas la cita —
            por ejemplo si el comprobante no corresponde. El cupo{' '}
            <strong>vuelve a quedar libre</strong> de inmediato.
          </li>
          <li>
            <strong>Marcar completada</strong> (desde confirmada): la sesión ya
            ocurrió. El cupo <strong>sigue ocupado</strong>, porque esa hora
            realmente se usó y no debe ofrecerse a nadie más.
          </li>
          <li>
            <strong>Cancelar</strong> (desde confirmada): la cita no va a
            ocurrir. El cupo <strong>vuelve a quedar libre</strong>.
          </li>
          <li>
            <strong>Deshacer completada</strong>: la devuelve a confirmada, por
            si la marcaste por error. El cupo no se mueve.
          </li>
        </ul>
        <p className="mt-2">
          En resumen: <strong>pendiente, confirmada y completada</strong>{' '}
          mantienen la hora reservada. <strong>Rechazada y cancelada</strong> la
          liberan.
        </p>
        <p className="mt-2">
          Ninguno de estos botones tiene límite de tiempo para ti: puedes
          cancelar una sesión que empieza en una hora. El límite de 24 horas
          solo aplica al paciente, y solo para reprogramar.
        </p>
        <p className="mt-2">
          Rechazar y cancelar te piden confirmación antes de proceder, porque{' '}
          <strong>no se pueden deshacer desde esta página</strong>. Si liberas
          un cupo por error, la forma de recuperarlo es crear la cita de nuevo
          con <strong>Nueva cita</strong> — y solo si nadie tomó esa hora
          mientras tanto.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Reprogramar una cita</p>
        <p className="mt-1">
          El botón <strong>Reprogramar</strong> aparece en las citas pendientes
          y confirmadas. Elige la nueva fecha y hora y listo: el sistema toma el
          cupo nuevo y libera el viejo en una sola operación, así que nunca te
          quedas sin ninguno de los dos.
        </p>
        <p className="mt-1">
          <strong>A ti no te aplica el límite de 24 horas.</strong> Puedes mover
          una sesión que empieza en un rato. Lo único que el sistema no te deja
          es mover una cita a un horario que no ofreces o que ya está tomado.
        </p>
        <p className="mt-1">
          El paciente conserva su mismo código, y al consultarlo verá la fecha
          nueva. Aun así, conviene avisarle tú.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">
          Lo que el paciente puede hacer solo
        </p>
        <p className="mt-1">
          Desde <strong>Mis citas</strong>, con su código, un paciente puede
          <strong> cambiar su fecha u hora</strong> — pero solo si faltan 24
          horas o más para la sesión, y como máximo <strong>dos veces</strong>.
          Pasado ese punto la opción desaparece y el mensaje le indica que te
          escriba.
        </p>
        <p className="mt-1">
          <strong>Cancelar no lo puede hacer nunca.</strong> No hay botón para
          eso en ningún caso; siempre se le dice que te contacte. Cancelar sigue
          siendo solo tuyo.
        </p>
        <p className="mt-1">
          Cada cambio que hace un paciente aparece en{' '}
          <strong>Novedades</strong>, en el Dashboard. Revísalo: es la forma de
          enterarte, porque el sistema no envía correos.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">
          Una reparación automática que corre sola
        </p>
        <p className="mt-1">
          Cada vez que abres esta página, el sistema cuadra los cupos con las
          citas, en las dos direcciones y sin preguntarte: bloquea la hora de
          una cita activa a la que le falte el cupo, y libera cupos que ya no
          corresponden a ninguna cita.
        </p>
        <p className="mt-1">
          Eso segundo es lo que recupera la hora que deja libre un paciente al
          reprogramar: por seguridad su navegador no puede borrar cupos, así
          que la hora vieja sigue ocupada hasta que tú entras aquí. Si
          reprograman con poca antelación y quieres que esa hora se libere
          pronto, basta con que abras Citas.
        </p>
        <p className="mt-1">
          No tienes que hacer nada ni te va a pedir nada. Se menciona solo para
          que sepas que, si notas una pequeña demora al entrar a Citas, es esto.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Tus días y horas de consulta</p>
        <p className="mt-1">
          Los cupos que ven los pacientes salen de lo que configures en{' '}
          <strong>Disponibilidad</strong>, en el menú lateral. Ahí eliges qué
          días atiendes, a qué horas y qué fechas bloqueas. En esa página hay
          una guía con el detalle.
        </p>
      </div>
    </HelpPanel>
  )
}
