export default function ContactoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contacto</h1>
        <p className="text-muted-foreground mt-2">
          Completá el formulario y te respondemos a la brevedad.
        </p>
      </div>

      <form className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="nombre" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              placeholder="Tu nombre"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="empresa" className="text-sm font-medium">
              Empresa <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              placeholder="Nombre de tu empresa"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="telefono" className="text-sm font-medium">
              Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="+54 11 0000-0000"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="asunto" className="text-sm font-medium">
            Asunto
          </label>
          <input
            id="asunto"
            name="asunto"
            type="text"
            required
            placeholder="ej. Consulta sobre rodamientos industriales"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="mensaje" className="text-sm font-medium">
            Mensaje
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            required
            rows={5}
            placeholder="Contanos en qué podemos ayudarte..."
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-y"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Enviar mensaje
        </button>
      </form>

      <div className="border-t pt-6 space-y-4 text-sm text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground text-base">Steyr Bearings Group</p>
          <p>Distribuidora e Importadora de Rodamientos</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="font-medium text-foreground mb-1">Dirección</p>
            <p>Trelles 2176</p>
            <p>CABA – Buenos Aires, Argentina</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Teléfono / Fax</p>
            <a href="tel:01145708222" className="hover:text-foreground transition-colors block">
              011 4570-8222
            </a>
            <a
              href="https://wa.me/5491140800657?text=Estoy%20en%20su%20tienda%2C%20necesito%20asesoramiento"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors block"
            >
              WhatsApp: +54 9 11 4080-0657
            </a>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Horario</p>
            <p>Lunes a viernes</p>
            <p>9:00 – 18:00 hs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
