// Pookie club welcome email. Table layout with inline styles so it holds up in Gmail, Outlook and phone mail apps.
// Images live in public/assets/email and are loaded from the live site.

const C = {
  blush: "#FFE6F1", berry: "#D61F69", berryDark: "#A8124F",
  butter: "#FFF1B8", plum: "#3B0A2A", plumSoft: "#6B3A5A",
};
const FONT = "'Bricolage Grotesque','Trebuchet MS',Arial,sans-serif";
const BODY = "'Figtree','Segoe UI',Helvetica,Arial,sans-serif";

function welcomeEmail({ site, phone = "+91 98794 30119", replyEmail = "azalea.hygiene@gmail.com" }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>Welcome to the Pookie club</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:${C.blush}}
  a{color:${C.berry}}
  @media (max-width:600px){
    .pad-x{padding-left:24px!important;padding-right:24px!important}
    .h1{font-size:32px!important;line-height:38px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.blush}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">A warm hello from your new period bestie 💗&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.blush}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">

  <!-- Brand -->
  <tr><td align="center" style="padding:4px 0 18px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle" style="padding-right:10px"><img src="${site}/assets/email/azalea-mark.png" width="38" height="44" alt="" style="display:block;border:0"></td>
      <td valign="middle">
        <div style="font-family:${FONT};font-size:30px;font-weight:800;letter-spacing:-1px;line-height:30px;color:${C.berry}">pookie</div>
        <div style="font-family:${BODY};font-size:12px;font-weight:600;color:${C.plumSoft};padding-top:2px">by Azalea Hygiene</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#ffffff;border-radius:32px;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

      <tr><td style="padding:0"><img src="${site}/assets/email/welcome-hero.jpg" width="560" alt="Pookie pads with soft white pads on a pink background" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:32px 32px 0 0"></td></tr>

      <tr><td class="pad-x" align="center" style="padding:34px 44px 6px">
        <h1 class="h1" style="margin:0;font-family:${FONT};font-size:38px;line-height:44px;font-weight:800;letter-spacing:-1px;color:${C.plum}">You're in,&nbsp;pookie!&nbsp;🎀<br><span style="color:${C.berry}">Welcome to the Pookie&nbsp;club</span></h1>
      </td></tr>

      <tr><td class="pad-x" style="padding:20px 48px 0;font-family:${BODY};font-size:17px;line-height:28px;color:${C.plumSoft};text-align:center">
        Hi lovely, thank you for joining us! Pookie is made with a whole lot of love by Azalea Hygiene, for every girl who deserves comfy days, every day of the month.<br><br>
        From now on, you'll find us in your inbox with special offers just for club members and little tips for happier, comfier periods. Short, sweet, and only when it's worth&nbsp;it&nbsp;💌
      </td></tr>

      <!-- Gentle reminder -->
      <tr><td class="pad-x" style="padding:26px 40px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.butter};border-radius:24px"><tr>
          <td align="center" style="padding:22px 26px;font-family:${BODY};font-size:16px;line-height:26px;color:${C.plum}">
            <div style="font-family:${FONT};font-size:19px;font-weight:800;padding-bottom:6px">Before you go&nbsp;🌸</div>
            Drink some water, stretch a little, and give yourself a pat on the back. You're doing great, every single&nbsp;day.
          </td></tr></table>
      </td></tr>

      <tr><td align="center" style="padding:28px 0 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tr>
          <td style="border-radius:999px;background:${C.berry};box-shadow:0 4px 0 ${C.berryDark}">
            <a href="${site}" style="display:inline-block;padding:14px 30px;font-family:${BODY};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Visit Pookie</a>
          </td></tr></table>
      </td></tr>

      <!-- Sign-off -->
      <tr><td class="pad-x" align="center" style="padding:30px 44px 36px;font-family:${BODY};font-size:16px;line-height:25px;color:${C.plumSoft}">
        Sending you comfy vibes,<br>
        <span style="font-family:${FONT};font-size:22px;font-weight:800;color:${C.berry}">Team Pookie 💗</span>
      </td></tr>

    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:22px 24px 8px;font-family:${BODY};font-size:12px;line-height:19px;color:${C.plumSoft}">
    Questions? Write to <a href="mailto:${replyEmail}" style="color:${C.plumSoft};white-space:nowrap">${replyEmail}</a> or call <a href="tel:${phone.replace(/\s/g, "")}" style="color:${C.plumSoft};white-space:nowrap">${phone}</a>.<br>
    Pookie is a product of Azalea Hygiene, Ahmedabad, Gujarat.<br>
    You're getting this because you joined the Pookie club. Don't want these emails? Just reply "stop".
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

module.exports = { welcomeEmail };
