import { HelpPanel } from '../../components/HelpPanel'

/** Explains the availability form in terms of what the patient ends up seeing. */
export function AvailabilityHelp() {
  return (
    <HelpPanel title="Cómo funciona esta página" tone="lavender">
      <p>
        Lo que guardes aquí es exactamente lo que verán los pacientes al
        agendar. No hay una lista de cupos fija por detrás: el sitio arma las
        opciones a partir de esta configuración cada vez que alguien entra a
        reservar.
      </p>

      <div>
        <p className="font-medium text-ink">Días activos</p>
        <p className="mt-1">
          Marca los días en que atiendes. Solo <strong>lunes, martes y
          miércoles</strong> se pueden marcar; de jueves a domingo aparecen
          apagados a propósito, porque la consulta no trabaja esos días.
        </p>
        <p className="mt-1">
          Si desmarcas los tres, <strong>la agenda queda cerrada</strong> y
          nadie podrá reservar hasta que vuelvas a marcar alguno. Es útil si
          necesitas parar un tiempo.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Horarios</p>
        <p className="mt-1">
          Escribe las horas separadas por comas, en formato de 24 horas — por
          ejemplo <code className="text-xs">09:00, 10:00, 14:00</code>. Se
          ordenan y se limpian solas al guardar.
        </p>
        <p className="mt-1">
          El máximo es de <strong>6 horarios por día</strong>. Si escribes más,
          el sistema no guarda y te avisa. Estas mismas horas aplican a todos
          los días que tengas activos.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Fechas bloqueadas</p>
        <p className="mt-1">
          Para cerrar un día puntual — un feriado, un viaje, una cita médica —
          agrégalo aquí. Ese día desaparece del calendario del paciente aunque
          caiga en un día activo.
        </p>
      </div>

      <div>
        <p className="font-medium text-ink">Sobre las citas ya agendadas</p>
        <p className="mt-1">
          Cambiar esta configuración <strong>no cancela ni mueve</strong> las
          citas que ya existen. Si quitas un horario o bloqueas una fecha donde
          ya hay alguien agendado, esa cita sigue en pie y la verás en{' '}
          <strong>Citas</strong> como siempre; lo único que cambia es que nadie
          nuevo podrá reservar ahí.
        </p>
        <p className="mt-1">
          Si tu intención era liberar ese día, cancela esas citas una por una
          desde <strong>Citas</strong> y avísale a cada paciente.
        </p>
      </div>

      <p>
        Los cambios se aplican al pulsar <strong>Guardar</strong>. Un paciente
        que ya tenga la página de reservas abierta seguirá viendo lo anterior
        hasta que la recargue.
      </p>
    </HelpPanel>
  )
}
