interface CampaignEmailProps {
  subject: string
  htmlContent: string
  unsubscribeUrl?: string
}

export function renderCampaignEmail(props: CampaignEmailProps): string {
  const { subject, htmlContent, unsubscribeUrl } = props
  const unsubscribeRow = unsubscribeUrl
    ? `<p style="color:#9ca3af;font-size:12px;margin-top:8px"><a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline">Desuscribirse</a></p>`
    : ''
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="font-family:Arial,sans-serif;background-color:#f9fafb;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff">
  <tr><td style="background-color:#1e40af;padding:24px 32px">
    <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">Seekingbusiness</h1>
  </td></tr>
  <tr><td style="padding:32px">${htmlContent}</td></tr>
  <tr><td style="border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;margin:0">Recibís este mensaje porque sos un cliente registrado de Seekingbusiness.</p>
    ${unsubscribeRow}
  </td></tr>
</table>
</body></html>`
}
