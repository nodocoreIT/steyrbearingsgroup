interface NewQuoteRequestEmailProps {
  vendedorName: string
  clientName: string
  productCount: number
  reviewUrl: string
}

export function renderNewQuoteRequestEmail(props: NewQuoteRequestEmailProps): string {
  const { vendedorName, clientName, productCount, reviewUrl } = props
  const productWord = productCount === 1 ? 'producto' : 'productos'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nueva solicitud de presupuesto</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f9fafb;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff">
  <tr><td style="background-color:#1e40af;padding:24px 32px">
    <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">Seekingbusiness — Nueva solicitud de presupuesto</h1>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="color:#111827;font-size:22px;margin-top:0">Acción requerida</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6">Hola ${vendedorName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6">El cliente <strong>${clientName}</strong> envió una solicitud de presupuesto con <strong>${productCount} ${productWord}</strong>. Por favor revisá y preparás su presupuesto a la brevedad.</p>
    <table cellpadding="0" cellspacing="0" style="margin-top:24px">
      <tr><td><a href="${reviewUrl}" style="display:inline-block;background-color:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">Ver solicitud</a></td></tr>
    </table>
  </td></tr>
  <tr><td style="border-top:1px solid #e5e7eb;padding:24px 32px">
    <p style="color:#9ca3af;font-size:12px;margin:0">Esta es una notificación interna del CRM de Seekingbusiness.</p>
  </td></tr>
</table>
</body></html>`
}
