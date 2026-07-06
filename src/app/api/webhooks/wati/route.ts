// Wati.io webhook — NOT IMPLEMENTED in MVP
// Full implementation deferred post-MVP after WhatsApp Business verification
// Ready for post-MVP Wati.io integration

export async function POST() {
  return Response.json(
    { message: 'Wati.io integration not yet active' },
    { status: 501 }
  )
}
