/**
 * Guía Operativa de Agentes — Dashboard Elecsa
 * Ruta pública: /guia/agentes
 *
 * Reemplaza el iframe anterior por contenido completo:
 * acceso, lectura del dashboard, flujo Sofía, tomar conversación,
 * responder, notas internas, reasignación, alertas WA y reglas.
 *
 * @id IMPL-20260506-06
 * @respaldo context/SPECs/ — ARCH-20260506-02
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía de Agentes | Elecsa Chat",
  description:
    "Manual operativo completo para agentes: acceso, dashboard, flujo de Sofía, conversaciones, notas, etiquetas y buenas prácticas.",
};

// ---------------------------------------------------------------------------
// Componentes locales de presentación
// ---------------------------------------------------------------------------

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Badge({
  color,
  children,
}: {
  color: "red" | "blue" | "green" | "teal" | "orange" | "purple";
  children: React.ReactNode;
}) {
  const map = {
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${map[color]}`}
    >
      {children}
    </span>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="list-none space-y-1 pl-0">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
      <span className="flex-shrink-0 font-bold">⚠</span>
      <span>{children}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-xs">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function GuiaAgentesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Encabezado */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-8 shadow-md">
        <div className="max-w-3xl mx-auto">
          <p className="text-blue-200 text-xs uppercase tracking-widest font-semibold mb-1">
            Elecsa Chat · Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
            Guía Operativa de Agentes
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            Todo lo que necesitas saber para atender conversaciones, interpretar
            alertas y trabajar junto con Sofía.
          </p>
          <p className="text-blue-200 text-xs mt-3">
            Versión 2.0 · Mayo 2026
          </p>
        </div>
      </header>

      {/* Índice navegable (desktop sticky, mobile visible) */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex gap-4 px-6 py-2 text-xs font-medium text-slate-500 whitespace-nowrap">
          {[
            ["#acceso", "Acceso"],
            ["#dashboard", "Dashboard"],
            ["#sofia", "Sofía"],
            ["#tomar", "Tomar conv."],
            ["#responder", "Responder"],
            ["#notas", "Notas"],
            ["#etiquetas", "Etiquetas"],
            ["#cerrar", "Cerrar"],
            ["#whatsapp", "WhatsApp"],
            ["#reglas", "Reglas"],
            ["#soporte", "Soporte"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="hover:text-blue-600 transition-colors py-1"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* 1. Acceso */}
        <Section id="acceso" title="1. Acceso al sistema">
          <p className="font-semibold text-slate-800">Primer ingreso</p>
          <Steps
            items={[
              "Entra a la URL del dashboard que te proporcionó tu supervisor.",
              "Inicia sesión con tu correo y contraseña temporal.",
              "Si el sistema pide cambio de contraseña, complétalo de inmediato.",
            ]}
          />
          <p className="font-semibold text-slate-800 pt-2">Inicio normal</p>
          <Steps
            items={[
              "Ve a la pantalla de login.",
              "Escribe tu correo y contraseña.",
              "Al entrar verás la lista de conversaciones y el panel del chat.",
            ]}
          />
          <InfoBox>
            Si no puedes entrar, contacta a tu supervisor o al administrador.
          </InfoBox>
        </Section>

        {/* 2. Dashboard */}
        <Section id="dashboard" title="2. Qué ves en el dashboard">
          <p>
            El dashboard tiene dos zonas: <strong>columna izquierda</strong>{" "}
            (lista de conversaciones) y <strong>panel derecho</strong> (detalle
            del chat seleccionado). Verás alertas visuales y de sonido cuando
            una conversación requiera humano.
          </p>

          <p className="font-semibold text-slate-800 pt-1">
            Indicadores visuales
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Indicador
                  </th>
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Significado
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    <Badge key="r" color="red">● Punto rojo parpadeante</Badge>,
                    "La conversación necesita atención humana",
                  ],
                  [
                    <Badge key="b" color="blue">🔢 Badge azul con número</Badge>,
                    "Hay mensajes sin leer",
                  ],
                  [
                    <Badge key="g" color="green">👤 Badge verde con nombre</Badge>,
                    "Ya hay un agente asignado",
                  ],
                  [
                    <Badge key="t" color="teal">🏢 Badge teal con sucursal</Badge>,
                    "Sucursal detectada del cliente",
                  ],
                  [
                    <Badge key="w" color="green">✓ Badge verde "WhatsApp"</Badge>,
                    "Conversación canalizada por WhatsApp a agentes",
                  ],
                  [
                    <Badge key="o" color="orange">▬ Barra inferior roja/naranja</Badge>,
                    "Hay conversaciones pendientes de atención humana",
                  ],
                ].map(([indicator, meaning], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="p-2 border border-slate-200">{indicator}</td>
                    <td className="p-2 border border-slate-200">{meaning as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-semibold text-slate-800 pt-2">
            Orden de lectura al abrir el dashboard
          </p>
          <Steps
            items={[
              "Menú lateral: confirma que estás en Conversaciones.",
              "Buscador: localiza clientes por nombre o número.",
              "Lista de conversaciones: identifica primero las que tengan alertas o no leídos.",
              "Badge de sucursal: confirma si el chat corresponde a tu zona.",
              "Badge de agente asignado: verifica si ya hay un responsable atendiendo.",
              "Badge de WhatsApp: indica que hubo canalización adicional.",
              "Panel derecho: muestra el historial completo de la conversación.",
              "Botones de acción: Tomar, Retomar IA o Cerrar según el caso.",
              "Barra inferior: resumen de conversaciones activas, sin leer y con alerta.",
            ]}
          />

          <Tip>
            Antes de responder: verifica que el chat sea de tu sucursal, que no
            tenga agente asignado ya, y que Sofía no haya recibido datos
            importantes del cliente.
          </Tip>
        </Section>

        {/* 3. Sofía y escalación */}
        <Section id="sofia" title="3. Cómo trabaja Sofía y cuándo escala">
          <p>
            Sofía resuelve lo que puede sin riesgo. Cuando llega a ti, el chat
            ya trae contexto: no estás entrando desde cero.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="font-semibold text-green-800 text-xs mb-1">
                ✓ Caso A — Sofía resuelve sola
              </p>
              <p className="text-xs text-green-700">
                Preguntas generales, saludos, consultas simples de producto,
                dudas de horarios o ubicación. No necesitas intervenir.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-800 text-xs mb-1">
                ⚡ Caso B — Sofía escala a humano
              </p>
              <ul className="text-xs text-red-700 list-disc pl-3 space-y-0.5">
                <li>Cotización formal</li>
                <li>PDF o imagen adjunta</li>
                <li>Cliente pide hablar con persona</li>
                <li>Urgencia o queja</li>
                <li>Caso comercial importante</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-semibold text-amber-800 text-xs mb-1">
                ? Caso C — Sucursal ambigua
              </p>
              <p className="text-xs text-amber-700">
                Sofía le pregunta al cliente su ciudad/estado antes de escalar.
                No intervengas hasta que te sea asignado explícitamente.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="font-semibold text-blue-800 text-xs mb-1">
                📍 Caso D — Estado sin sucursal directa
              </p>
              <p className="text-xs text-blue-700">
                Sofía ofrece sucursales cercanas. El handoff ocurre cuando el
                cliente confirma cuál prefiere.
              </p>
            </div>
          </div>

          <p className="font-semibold text-slate-800 pt-2">
            Flujo de escalación (paso a paso)
          </p>
          <Steps
            items={[
              "Sofía detecta que la conversación necesita humano.",
              "Intenta identificar la sucursal correcta (ciudad, estado o abreviatura).",
              "Si encuentra sucursal: marca alerta, enciende el dashboard y puede notificar por WhatsApp.",
              "Si no encuentra sucursal: pregunta al cliente qué sucursal le queda mejor.",
              "Cuando el cliente confirma su zona, el handoff se completa.",
            ]}
          />

          <p className="font-semibold text-slate-800 pt-2">
            Qué debes hacer cuando Sofía te pasa el chat
          </p>
          <Steps
            items={[
              "Lee los últimos mensajes antes de responder.",
              "Revisa si el cliente ya compartió archivo o contexto técnico.",
              "Confirma sucursal y que eres el responsable.",
              "Responde como humano sin repetir preguntas que Sofía ya hizo.",
              "Si el cliente sigue ambiguo, guía para cerrar datos de cotización o ubicación.",
            ]}
          />
        </Section>

        {/* 4. Tomar conversación */}
        <Section id="tomar" title="4. Cómo tomar una conversación">
          <Steps
            items={[
              "Abre la conversación.",
              'Haz clic en "Tomar Conversación".',
              "El sistema te asigna ese chat.",
            ]}
          />
          <p>Al tomar correctamente:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La alerta roja se apaga.</li>
            <li>El sonido deja de repetirse para ese caso.</li>
            <li>Tu nombre aparece como agente asignado.</li>
          </ul>
          <Tip>
            Si ya aparece el nombre de otro agente, verifica primero si esa
            persona ya está atendiendo antes de intervenir. Como agente
            operativo no debes mover manualmente la conversación a otro asesor;
            repórtalo para reasignación.
          </Tip>

          <p className="font-semibold text-slate-800 pt-2">
            Reasignación manual (solo supervisor / admin)
          </p>
          <p>
            Si el chat llegó a la sucursal incorrecta o el responsable asignado
            no puede atender, el supervisor o administrador puede reasignarlo
            desde el panel de gestión. Como agente operativo:{" "}
            <strong>no duplicar atención</strong>, reportar el caso y esperar
            indicación.
          </p>
        </Section>

        {/* 5. Responder */}
        <Section id="responder" title="5. Cómo responder al cliente">
          <p className="font-semibold text-slate-800">Mensaje normal</p>
          <Steps
            items={[
              "Escribe en el campo inferior.",
              "Presiona Enter o el botón de enviar.",
            ]}
          />

          <p className="font-semibold text-slate-800 pt-2">
            Archivos e imágenes
          </p>
          <p>Puedes adjuntar imágenes, PDF y documentos comunes.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Si envías cotización, menciona qué contiene el archivo.</li>
            <li>Si el cliente adjunta un archivo, léelo antes de responder.</li>
          </ul>

          <p className="font-semibold text-slate-800 pt-2">
            Respuestas rápidas
          </p>
          <p>
            Usa el botón de respuestas rápidas para: saludar, pedir tiempo,
            confirmar recepción o cerrar cordialmente. Personaliza antes de
            enviar si hace falta.
          </p>
        </Section>

        {/* 6. Notas internas */}
        <Section id="notas" title="6. Notas internas">
          <InfoBox>
            Las notas internas son visibles <strong>solo para el equipo</strong>
            . El cliente no las ve.
          </InfoBox>
          <p className="pt-1">Úsalas para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dejar contexto al siguiente turno.</li>
            <li>Anotar acuerdos y datos importantes del cliente.</li>
            <li>Advertir temas pendientes.</li>
          </ul>

          <p className="font-semibold text-slate-800 pt-2">Ejemplos de buenas notas</p>
          <div className="bg-slate-100 rounded-lg p-3 space-y-1 text-xs font-mono text-slate-600">
            <p>• Cliente requiere factura con RFC confirmado.</p>
            <p>• Pidió seguimiento mañana por la tarde.</p>
            <p>• Proyecto industrial; pasar con asesor técnico si responde.</p>
            <p>• Está comparando con otra cotización.</p>
          </div>

          <p className="font-semibold text-slate-800 pt-2">Reglas</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Escribe claro y breve.</li>
            <li>No repitas el chat completo.</li>
            <li>Registra solo lo útil para la operación.</li>
          </ul>
        </Section>

        {/* 7. Etiquetas */}
        <Section id="etiquetas" title="7. Etiquetas">
          <p>
            Las etiquetas clasifican oportunidades y facilitan seguimiento y
            reportes.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Etiqueta
                  </th>
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Uso recomendado
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Nuevo", "Primer contacto", "blue"],
                  ["Interesado", "Hay interés real en compra", "purple"],
                  ["Cotización", "Ya pidió precios o propuesta", "orange"],
                  ["Seguimiento", "Hay que volver a contactar", "teal"],
                  ["Ganado", "Venta concretada", "green"],
                  ["Perdido", "No se cerró la venta", "red"],
                  ["Recurrente", "Cliente frecuente", "blue"],
                ].map(([label, desc, color]) => (
                  <tr
                    key={label}
                    className="odd:bg-white even:bg-slate-50"
                  >
                    <td className="p-2 border border-slate-200">
                      <Badge color={color as "blue" | "red" | "green" | "teal" | "orange" | "purple"}>
                        {label}
                      </Badge>
                    </td>
                    <td className="p-2 border border-slate-200">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Tip>
            No cierres conversaciones importantes sin al menos una etiqueta
            útil.
          </Tip>
        </Section>

        {/* 8. Cerrar / Retomar IA */}
        <Section id="cerrar" title="8. Cerrar una conversación · Retomar IA">
          <p className="font-semibold text-slate-800">Cuándo cerrar</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>El cliente ya fue atendido y la duda quedó resuelta.</li>
            <li>La venta terminó o se perdió claramente.</li>
            <li>No hay acción pendiente inmediata.</li>
          </ul>
          <p className="pt-1">
            Al cerrar: la conversación pasa a estado cerrado, se apagan alertas,
            desaparece del listado activo y el sistema puede generar un resumen
            automático.
          </p>
          <p className="font-semibold text-slate-800 pt-2">
            Antes de cerrar
          </p>
          <Steps
            items={[
              "Verifica si hace falta una nota.",
              "Agrega etiqueta final.",
              "Confirma que no quede nada pendiente para otro agente.",
            ]}
          />

          <p className="font-semibold text-slate-800 pt-2">Retomar IA</p>
          <p>
            Si la conversación volvió a algo simple, usa{" "}
            <strong>Retomar IA</strong> para que Sofía continúe.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
              <p className="font-semibold mb-1">✓ Úsalo cuando</p>
              <ul className="list-disc pl-3 space-y-0.5">
                <li>La consulta volvió a ser simple.</li>
                <li>Sofía puede continuar sin riesgo.</li>
                <li>No hay negociación ni queja activa.</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <p className="font-semibold mb-1">✗ No lo uses si</p>
              <ul className="list-disc pl-3 space-y-0.5">
                <li>El cliente está molesto.</li>
                <li>Hay una promesa comercial en curso.</li>
                <li>La conversación ya está en cierre de venta delicado.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 9. WhatsApp */}
        <Section id="whatsapp" title="9. Alertas por WhatsApp">
          <p>
            El aviso por WhatsApp existe para que el agente se entere aunque no
            esté logueado en el dashboard.
          </p>
          <Steps
            items={[
              "Entra al dashboard.",
              "Abre la conversación indicada en el aviso.",
              "Toma la conversación si te corresponde.",
              "Revisa sucursal, notas y contexto antes de responder.",
            ]}
          />
          <Tip>
            Si el aviso es de una sucursal que no te corresponde, repórtalo para
            reasignación. No respondas por duplicado si ya ves otro agente
            asignado en el dashboard.
          </Tip>

          <p className="font-semibold text-slate-800 pt-2">
            Notificaciones de sonido
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Sonido nuevo:</strong> entró una conversación relevante o
              aumentó la urgencia.
            </li>
            <li>
              <strong>Repetición:</strong> sigue existiendo al menos una
              conversación pendiente.
            </li>
            <li>
              El sonido debe detenerse cuando la conversación es tomada,
              asignada o cerrada. Si no ocurre, repórtalo con captura.
            </li>
          </ul>
        </Section>

        {/* 10. Reglas operativas */}
        <Section id="reglas" title="10. Buenas prácticas y reglas operativas">
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                label: "Al iniciar turno",
                items: [
                  "Revisa conversaciones activas de tu sucursal.",
                  "Revisa notas pendientes.",
                  "Identifica seguimientos del turno anterior.",
                ],
              },
              {
                label: "Durante el turno",
                items: [
                  "Atiende primero lo rojo.",
                  "No dejes conversaciones sin responsable.",
                  "Documenta con notas lo que otro agente deba saber.",
                  "Etiqueta conforme avanza la oportunidad.",
                ],
              },
              {
                label: "Al terminar turno",
                items: [
                  "Deja notas en casos abiertos.",
                  "Cierra lo que ya terminó.",
                  "Marca seguimiento donde aplique.",
                ],
              },
            ].map(({ label, items }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-lg p-3"
              >
                <p className="font-semibold text-slate-800 text-xs mb-2">
                  {label}
                </p>
                <ul className="text-xs text-slate-600 list-disc pl-3 space-y-1">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="font-semibold text-slate-800 pt-3">Qué no hacer</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No prometer inventario o entrega sin confirmación.</li>
            <li>
              No discutir con clientes molestos; escala a supervisor.
            </li>
            <li>No dejar conversaciones urgentes sin responsable.</li>
            <li>No usar etiquetas al azar.</li>
            <li>No cerrar un chat si hay un compromiso pendiente.</li>
            <li>No compartir datos internos en el mensaje al cliente.</li>
          </ul>
        </Section>

        {/* 11. Soporte */}
        <Section id="soporte" title="11. Soporte y reporte de problemas">
          <p>Si detectas un problema técnico, reporta:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Número del cliente o nombre visible.</li>
            <li>Hora aproximada.</li>
            <li>Sucursal esperada.</li>
            <li>Qué ocurrió realmente.</li>
            <li>Captura de pantalla si es posible.</li>
          </ol>

          <p className="font-semibold text-slate-800 pt-2">
            Ejemplos de incidencias
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No sonó la alerta.</li>
            <li>Siguió sonando después de tomar el chat.</li>
            <li>No llegó el aviso por WhatsApp.</li>
            <li>La sucursal se detectó mal.</li>
            <li>No puedo abrir un PDF o imagen.</li>
          </ul>
        </Section>

        {/* Resumen rápido */}
        <div className="bg-blue-700 text-white rounded-2xl p-6">
          <h2 className="text-base font-bold mb-3">Resumen operativo</h2>
          <ol className="space-y-2">
            {[
              "Detectar alertas (rojo parpadeante).",
              "Abrir la conversación correcta.",
              "Tomar la conversación si te corresponde.",
              "Responder con contexto (leer antes de escribir).",
              "Dejar nota y etiqueta.",
              "Cerrar cuando termine.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-blue-700 font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          Versión 2.0 · Mayo 2026 · Elecsa Chat
        </p>
      </main>
    </div>
  );
}
