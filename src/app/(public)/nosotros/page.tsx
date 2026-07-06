export default function NosotrosPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold">La Empresa</h1>
        <p className="text-muted-foreground mt-2">Steyr Bearings Group SA</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Steyr Bearings Group SA es una empresa enfocada en la importación y distribución de rodamientos.
          Distribuimos una gran variedad de marcas: <strong className="text-foreground">FAG, TIMKEN, INA, FERSA, NTN, KOYO, STEYR, SKF, EBI, KG, ZNL y CFC ITALY</strong>.
          Todas sinónimo de calidad y durabilidad, características indispensables para tu negocio.
        </p>
        <p>
          Cubrimos todos los segmentos: rodamientos para el sector automotor liviano y pesado, para la industria y el agro.
          Realizamos envíos a todo el país.
        </p>
        <p>
          Con más de <strong className="text-foreground">15 años de trayectoria</strong> en el mercado, Steyr Rodamientos no solo se ha posicionado como referente del sector,
          sino que brinda soluciones específicas de acuerdo a las necesidades particulares de cada cliente.
        </p>
      </div>

      <div className="border-t pt-6 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Steyr Bearings Group SA</p>
        <p>Manuel Ricardo Trelles 2176, CABA, Buenos Aires, Argentina</p>
        <p>
          <a href="tel:01145708222" className="hover:text-foreground transition-colors">
            Tel.: 011 4570-8222
          </a>
        </p>
        <p>
          <a
            href="https://wa.me/5491150507464"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            WhatsApp: 11 5050-7464
          </a>
        </p>
      </div>
    </div>
  )
}
