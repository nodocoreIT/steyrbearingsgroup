export default function EnvioPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold">Información de Envío</h1>
        <p className="text-muted-foreground mt-2">
          Realizamos envíos a todo el país.
        </p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Para coordinar el envío de tu pedido necesitamos que nos informes los siguientes datos:
        </p>

        <ul className="space-y-2 border rounded-xl p-5 bg-muted/40">
          <li className="flex items-start gap-2">
            <span className="font-medium text-foreground w-48 shrink-0">Nombre o razón social</span>
            <span>Nombre completo del destinatario o nombre de la empresa.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-foreground w-48 shrink-0">DNI o CUIT</span>
            <span>Documento del destinatario para la identificación del envío.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-foreground w-48 shrink-0">Dirección de envío</span>
            <span>Calle, número, piso/depto (si corresponde).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-foreground w-48 shrink-0">Provincia y localidad</span>
            <span>Para calcular costos y tiempos de entrega.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-foreground w-48 shrink-0">Teléfono de contacto</span>
            <span>Para que el transporte pueda coordinar la entrega.</span>
          </li>
        </ul>

        <p>
          Podés enviarnos esta información por WhatsApp o a través del formulario de contacto.
          Te informaremos el costo y tiempo estimado de entrega a la brevedad.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <a
          href="https://wa.me/5491150507464?text=Hola%2C%20quiero%20coordinar%20un%20env%C3%ADo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          Consultar por WhatsApp
        </a>
        <a
          href="/contacto"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Formulario de contacto
        </a>
      </div>
    </div>
  )
}
