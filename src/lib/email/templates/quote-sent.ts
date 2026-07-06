interface QuoteSentEmailProps {
  quoteNumber: number
  clientName: string
  itemsSummary: string
  viewQuoteUrl: string
  pdfUrl?: string
}

export function renderQuoteSentEmail(props: QuoteSentEmailProps): string {
  const { quoteNumber, clientName, itemsSummary, viewQuoteUrl, pdfUrl } = props
  const summaryHtml = itemsSummary.replace(/\n/g, '<br/>')
  const pdfButton = pdfUrl
    ? `<td><a href="${pdfUrl}" style="display:inline-block;border:1px solid #1e40af;color:#1e40af;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">Descargar PDF</a></td>`
    : ''
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Presupuesto listo</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f9fafb;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff">
  <tr><td style="background-color:#1e40af;padding:24px 32px">
    <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">Seekingbusiness</h1>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="color:#111827;font-size:22px;margin-top:0">Tu presupuesto está listo</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6">Hola ${clientName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6">El presupuesto <strong>#${quoteNumber}</strong> fue preparado para vos. Podés revisarlo online o descargar el PDF a continuación.</p>
    <div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:24px 0">
      <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Productos incluidos</p>
      <p style="color:#111827;font-size:14px;margin:0">${summaryHtml}</p>
    </div>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px"><a href="${viewQuoteUrl}" style="display:inline-block;background-color:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">Ver presupuesto</a></td>
        ${pdfButton}
      </tr>
    </table>
  </td></tr>
  <tr><td style="border-top:1px solid #e5e7eb;padding:24px 32px">
    <p style="color:#9ca3af;font-size:12px;margin:0">Este correo fue enviado por Seekingbusiness. Si no solicitaste este presupuesto, podés ignorar este mensaje.</p>
  </td></tr>
</table>
</body></html>`
}
