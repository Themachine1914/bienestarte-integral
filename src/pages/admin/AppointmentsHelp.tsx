import { HelpPanel } from '../../components/HelpPanel'

/** Guide for the practice owner. Describes what the buttons on this page
 *  actually do to a slot, since that is the part with lasting consequences. */
export function AppointmentsHelp() {
  return (
    <HelpPanel title="Cómo funciona esta página" tone="lavender">
      <div>
        <p className="font-medium text-ink">Ver el detalle de una cita</p>
        <p className="mt-1">
          Cada tarjeta muestra todo lo de esa cita: nombre del paciente,
          teléfono, correo si lo dejó, la fecha y hora, el tipo de sesión y el
          monto. Si el paciente escribió una nota al reservar, aparece debajo.
          A la derecha verás una etiqueta de color con el estado actual.
        </p>
        <p className="mt-1">
          El botón <strong>Ver comprobante</strong> abre en otra pestaña la
          imagen de la transferencia que subió el paciente. Si pidió un
          comprobante de servicio, verás su nombre fiscal debajo de la cita.
          El{' '}
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
          Esta es la parte importante. Cada cita ocupa uno, dos o tres cupos
          corridos en su fecha, y el estado decide si esos cupos siguen
          reservados o vuelven a quedar libres para otro paciente.
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
          <li>
            <strong>Recordatorio WhatsApp</strong>: lo envías tú, cuando
            quieras. Se abre el chat del paciente con el mensaje ya escrito —
            fecha, hora y un enlace para que confirme asistencia — y tú solo
            pulsas enviar. Si el paciente activó avisos en su celular, también
            le llega una notificación aunque no tenga el sitio abierto. No
            cambia el estado ni toca el cupo.
          </li>
        </ul>
        <p className="mt-2">
          <strong>El recordatorio no sale solo.</strong> Por ahora no hay envío
          automático: si no pulsas el botón, al paciente no le llega nada. Una
          vez enviado, la cita queda marcada como «Recordatorio WhatsApp
          enviado» y el botón pasa a decir <strong>Reenviar WhatsApp</strong>,
          para que sepas a quién ya avisaste.
        </p>
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
        <p className="font-medium text-ink">Agendar fuera de tu horario</p>
        <p className="mt-1">
          Tu agenda normal son los días y las horas que tengas guardados en{' '}
          <strong>Disponibilidad</strong>. Eso, y solo eso, es lo que ve el
          paciente en la web.
        </p>
        <p className="mt-1">
          Pero en <strong>Nueva cita</strong> puedes marcar{' '}
          <strong>Fuera del horario habitual</strong> y escribir la fecha y la
          hora que quieras: un viernes, un sábado, las 7 de la mañana, o un día
          que habías bloqueado. No tienes que ir a Disponibilidad ni desbloquear
          nada primero.
        </p>
        <p className="mt-1">
          Esa cita solo existe para ti: no abre el día en la web, así que ningún
          otro paciente puede reservar ahí. Si en cambio quieres abrir un
          horario para todos, eso sí se cambia en{' '}
          <strong>Disponibilidad</strong>.
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
          una sesión que empieza en un rato. Y si marcas{' '}
          <strong>Fuera del horario habitual</strong>, eliges cualquier día y
          hora, aunque no estén en tu agenda. Lo único que nunca podrás hacer es
          poner dos citas en el mismo cupo.
        </p>
        <p className="mt-1">
          Antes de confirmar puedes escribir una{' '}
          <strong>nota para el paciente</strong> — por ejemplo por qué tuviste
          que mover la sesión. Al confirmar aparece el botón{' '}
          <strong>Avisar por WhatsApp</strong>: se abre su chat con el mensaje
          ya escrito, con la fecha nueva, tu nota y el enlace para que consulte
          su cita. Tú solo pulsas enviar.
        </p>
        <p className="mt-1">
          El paciente conserva su mismo código, y al consultarlo verá la fecha
          nueva.
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
          También puede <strong>confirmar su asistencia</strong>, desde{' '}
          <strong>Mis citas</strong> o desde el enlace del recordatorio que le
          envías. Cuando lo hace, en su tarjeta aquí aparece{' '}
          <strong>«El paciente confirmó asistencia»</strong>.
        </p>
        <p className="mt-1">
          Cada cambio que hace un paciente aparece en{' '}
          <strong>Novedades</strong>, en el Dashboard. Si activaste avisos en
          este celular (abajo del panel), una cita nueva también te llega
          aunque tengas la app cerrada. El sitio no envía correos: el aviso al
          paciente sale por WhatsApp cuando tú lo mandas, y por notificación
          si él activó avisos.
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
