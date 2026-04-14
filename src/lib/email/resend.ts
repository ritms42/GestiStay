import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

const APP_NAME = 'GestiStay'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@gestistay.com'

export async function sendBookingConfirmation({
  to,
  guestName,
  propertyTitle,
  checkIn,
  checkOut,
  totalPrice,
}: {
  to: string
  guestName: string
  propertyTitle: string
  checkIn: string
  checkOut: string
  totalPrice: string
}) {
  return resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Réservation confirmée - ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Réservation confirmée !</h1>
        <p>Bonjour ${guestName},</p>
        <p>Votre réservation a été confirmée avec succès.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${propertyTitle}</h3>
          <p><strong>Arrivée :</strong> ${checkIn}</p>
          <p><strong>Départ :</strong> ${checkOut}</p>
          <p><strong>Total :</strong> ${totalPrice}</p>
          <p style="color: #16a34a; font-weight: bold;">Commission GestiStay : 0€</p>
        </div>
        <p>Vous pouvez consulter les détails de votre réservation dans votre espace <a href="${process.env.NEXT_PUBLIC_APP_URL}/trips">Mes voyages</a>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">${APP_NAME} - Vos locations, vos revenus</p>
      </div>
    `,
  })
}

export async function sendNewBookingNotification({
  to,
  hostName,
  guestName,
  propertyTitle,
  checkIn,
  checkOut,
  totalPrice,
}: {
  to: string
  hostName: string
  guestName: string
  propertyTitle: string
  checkIn: string
  checkOut: string
  totalPrice: string
}) {
  return resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Nouvelle réservation - ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Nouvelle réservation !</h1>
        <p>Bonjour ${hostName},</p>
        <p>Vous avez reçu une nouvelle réservation.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${propertyTitle}</h3>
          <p><strong>Voyageur :</strong> ${guestName}</p>
          <p><strong>Arrivée :</strong> ${checkIn}</p>
          <p><strong>Départ :</strong> ${checkOut}</p>
          <p><strong>Montant :</strong> ${totalPrice}</p>
          <p style="color: #16a34a; font-weight: bold;">100% pour vous, 0% de commission !</p>
        </div>
        <p>Consultez la réservation dans votre <a href="${process.env.NEXT_PUBLIC_APP_URL}/reservations">Dashboard</a>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">${APP_NAME} - Vos locations, vos revenus</p>
      </div>
    `,
  })
}

export async function sendNewReviewNotification({
  to,
  hostName,
  propertyTitle,
  rating,
  comment,
}: {
  to: string
  hostName: string
  propertyTitle: string
  rating: number
  comment: string | null
}) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Nouvel avis ${stars} - ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Nouvel avis reçu</h1>
        <p>Bonjour ${hostName},</p>
        <p>Un voyageur a laissé un avis sur votre bien <strong>${propertyTitle}</strong>.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 24px; margin-top: 0;">${stars}</p>
          ${comment ? `<p style="font-style: italic;">"${comment}"</p>` : ''}
        </div>
        <p>Vous pouvez répondre à cet avis depuis votre <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Dashboard</a>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">${APP_NAME} - Vos locations, vos revenus</p>
      </div>
    `,
  })
}

export async function sendNewMessageNotification({
  to,
  recipientName,
  senderName,
  propertyTitle,
  messagePreview,
}: {
  to: string
  recipientName: string
  senderName: string
  propertyTitle: string
  messagePreview: string
}) {
  return resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `Nouveau message de ${senderName} - ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Nouveau message</h1>
        <p>Bonjour ${recipientName},</p>
        <p><strong>${senderName}</strong> vous a envoyé un message concernant <strong>${propertyTitle}</strong>.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-style: italic;">"${messagePreview}"</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/messages">Répondre au message</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">${APP_NAME} - Vos locations, vos revenus</p>
      </div>
    `,
  })
}
