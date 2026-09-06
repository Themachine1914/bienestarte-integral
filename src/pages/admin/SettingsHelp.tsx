import { HelpPanel } from '../../components/HelpPanel'

/** Account and panel access, written for the practice owner. */
export function SettingsHelp() {
  return (
    <HelpPanel title="Cómo funciona esta página" tone="lavender">
      <p>
        Aquí cambias lo que ve el paciente: el nombre del consultorio, los
        precios y las cuentas para transferir. Al pulsar{' '}
        <strong>Guardar configuración</strong> queda publicado.
      </p>

      <div>
        <p className="font-medium text-ink">Si olvidas tu clave</p>
        <p className="mt-1">
          Eres la única persona con acceso a este panel. La clave no está
          guardada en ningún otro lado. Si no la recuerdas:
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>
            En <strong>Acceso admin</strong> pulsa{' '}
            <strong>¿Olvidaste tu contraseña?</strong>
          </li>
          <li>
            Escribe <strong>el mismo correo</strong> con el que entras, no
            otro.
          </li>
          <li>
            Pulsa <strong>Enviar enlace</strong>. Te llega un correo (mira
            también spam).
          </li>
          <li>
            Abre el enlace, elige una clave nueva y vuelve a entrar.
          </li>
        </ol>
        <p className="mt-2">
          El enlace vence en una hora. Si no llega, vuelve a pedirlo desde{' '}
          <strong>/admin/recuperar</strong>. Nadie más puede hacerlo por ti
          desde aquí.
        </p>
      </div>
    </HelpPanel>
  )
}
