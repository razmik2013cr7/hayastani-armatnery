// OPTIONAL — not required for the app to work.
//
// The shop-purchase email is sent directly from the app through FormSubmit
// (no setup needed). This Edge Function is kept as a more robust alternative:
// if you prefer server-side delivery with Resend, deploy it and switch the
// trigger described at the bottom of supabase-migration.sql back on.
//
// Deploy once from the project root:
//   supabase functions deploy send-shop-order-email --project-ref xpodpnzdwkmeticzbvvb
//   supabase secrets set RESEND_API_KEY=<your Resend API key>

const SHOP_OWNER_EMAIL = 'rafikmkrtchyan25@gmail.com'
// Must be a sender verified in your Resend account (resend.com → Domains).
const FROM_EMAIL = 'onboarding@resend.dev'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok')
  }

  try {
    const { item_name, buyer_name } = await req.json()

    const subject = `«${item_name}» գնվել է «${buyer_name}» կողմից`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: `Shop <${FROM_EMAIL}>`,
        to: [SHOP_OWNER_EMAIL],
        subject,
        text: subject,
      }),
    })

    if (!resendRes.ok) {
      const detail = await resendRes.text()
      console.error('Resend error:', detail)
      return new Response(JSON.stringify({ error: detail }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-shop-order-email failed:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
