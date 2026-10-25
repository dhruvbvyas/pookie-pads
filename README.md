# Pookie Pads website (Azalea Hygiene)

One-page store with a basket, checkout (cash on delivery, optional Razorpay), order SMS via Fast2SMS, and emails via Brevo.

## Run it on your computer

Needs Node.js 18 or newer. No packages to install.

```
node server.js
```

Then open http://localhost:5173. Without keys the site runs in **demo mode**: orders are saved, and SMS/emails are printed in the terminal instead of being sent.

## Turn on SMS, email and payments

1. Copy `.env.example` to `.env`.
2. Fill in the keys below, then restart `node server.js`. The terminal shows which services are on.

| What | Service | Where to get it |
| --- | --- | --- |
| Order confirmation SMS to customers | Fast2SMS | fast2sms.com > Dev API > API key. Add wallet balance. The "Quick SMS" route works before DLT approval. |
| Pookie club welcome email, and new-order emails to you | Brevo (free tier: 300 emails/day) | brevo.com > SMTP & API > API keys. Verify your sender address under Senders. Set `ORDER_EMAIL_TO` to your email. |
| Online payments (UPI, cards) | Razorpay | dashboard.razorpay.com > Settings > API keys. Start with `rzp_test_` keys; switch to live keys after KYC. |

If Razorpay keys are empty, checkout offers cash on delivery only.

## Change prices or products

Edit `catalog.json` and restart the server. The 50-pad prices (₹349) are **placeholders**: set your real prices. The server always uses these prices, whatever the browser sends.

## Where orders go

- Every order is saved in `data/orders.json`.
- If Brevo is set up, every order is also emailed to `ORDER_EMAIL_TO`, which is the most reliable record.
- Club members are saved in `data/subscribers.json`.

## Put it online

The site needs a host that runs Node (a static host like Netlify Drop won't run the order system). Good options: Render, Railway or a small VPS.

- Start command: `node server.js`
- Add the same variables from `.env` in the host's environment settings (don't upload `.env`).
- Give the host a persistent disk for `data/`, or orders saved there are lost on redeploy. The order emails stay safe either way.

## Brand assets

`brand-assets/4k/` has 4K renders of every pack and the pad, plus HD exports of the four stickers, for social media and print.
