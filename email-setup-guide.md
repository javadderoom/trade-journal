# Setting Up Your Custom Email: `info@tradekav.ir`

This guide outlines your options and provides step-by-step instructions for setting up a custom email address (`info@tradekav.ir`) for your domain.

---

## Important Context for `.ir` Domains
Because `tradekav.ir` is an Iranian country-code top-level domain (ccTLD), **major US and Western email providers (like Google Workspace, Zoho Mail, and Microsoft 365) block or restrict `.ir` domains due to sanctions.**

Therefore, you have three primary paths forward:

1. **Option A: Cloudflare Email Routing (Free, Easiest, Incoming Forwarding)**
   * Best if you only need to receive emails (e.g. forward `info@tradekav.ir` to a personal Gmail or Outlook address).
2. **Option B: Cheap cPanel/Dedicated Email Hosting (Highly Recommended for Outgoing & Incoming)**
   * Best for professional use. You buy a tiny, cheap email-only hosting plan from a provider that supports `.ir` domains, and point your DNS MX records there.
3. **Option C: Self-Host a Mail Server on Your VPS (Advanced, Free)**
   * Build a mail server container (like Stalwart or Docker-Mailserver) using Coolify. 
   * **Warning:** Extremely high maintenance, VPS IP ranges are often blacklisted by Gmail/Outlook, and most VPS providers block port 25.

---

## Option A: Cloudflare Email Routing (Free, Easiest)

If you only need a way to receive emails sent to `info@tradekav.ir` and forward them to your existing personal email address (e.g., `yourname@gmail.com`), Cloudflare provides this service completely for free.

### Step-by-Step Setup:
1. **Set Cloudflare as Your DNS Provider**:
   Ensure `tradekav.ir` is added to your Cloudflare account and your domain name servers (NS) point to Cloudflare.
2. **Enable Email Routing**:
   * Log into your Cloudflare Dashboard.
   * Go to **Email** -> **Email Routing**.
   * Click **Get started**.
3. **Configure Destination Addresses**:
   * Add your personal email address (e.g., `yourname@gmail.com`) as a destination.
   * Go to your personal email inbox, open the confirmation email from Cloudflare, and click verify.
4. **Create a Routing Rule**:
   * In Cloudflare under Email Routing, go to **Routing Rules** -> **Create Rule**.
   * Set **Custom address** to `info` (`info@tradekav.ir`).
   * Set **Destination** to your verified personal email.
5. **Auto-Configure DNS Records**:
   * Cloudflare will alert you that MX and SPF records are missing. Click the **Add records automatically** button. Cloudflare will insert the correct MX records for routing emails.

> [!NOTE]
> **To reply or send emails as `info@tradekav.ir` for free using Gmail:**
> You can sign up for a free outbound SMTP relay like **Brevo (formerly Sendinblue)** or **Mailjet** (both have free tiers for sending up to 300 emails/day).
> 1. Create a free account on Brevo/Mailjet.
> 2. Verify your domain `tradekav.ir` by adding the TXT records they provide.
> 3. Go to your **personal Gmail settings** -> **Accounts and Import** -> **Send mail as** -> **Add another email address**.
> 4. Enter name and `info@tradekav.ir`.
> 5. Enter the SMTP server host, username, and password provided by Brevo/Mailjet.
> 6. Now you can select `info@tradekav.ir` in the "From" dropdown in Gmail.

---

## Option B: cPanel / Email Hosting (Highly Recommended)

Using a dedicated email hosting service is the most reliable way to send and receive emails without getting blacklisted. 

Since Zoho/Google/Microsoft restrict `.ir` domains, you can use:
* **Yandex 360 for Business** (Russian-based, cheap, works perfectly with `.ir` domains).
* **Local Iranian Providers** (e.g., Iran Server, Host Iran, Pars Pack) which sell tiny "Email Hosting" packages (e.g., 500MB to 1GB disk space) for a very low annual fee.

### Step-by-Step Setup:
1. **Purchase Email Hosting**:
   Buy a basic email hosting plan or a cheap cPanel hosting plan for `tradekav.ir`.
2. **Get DNS Records**:
   The provider will give you:
   * **MX Records** (e.g., `mx.yandex.net` or `mail.tradekav.ir`).
   * **SPF Record** (TXT record to allow their servers to send email on your behalf).
   * **DKIM Record** (TXT record containing a cryptographic key to sign emails).
   * **DMARC Record** (TXT record specifying email validation policies).
3. **Configure DNS in Cloudflare**:
   Go to your Cloudflare DNS panel and add the records provided above. Make sure to delete any other MX records.
4. **Access Webmail**:
   You can log in to your email inbox via the web interface provided (e.g., Yandex Mail or your cPanel's Roundcube webmail) or add the account to Outlook, Apple Mail, or Gmail via IMAP/SMTP.

---

## Option C: Self-Hosting a Mail Server in Coolify (Advanced)

If you absolutely want to host it yourself on your existing Coolify VPS to save costs and avoid external providers, you can deploy the modern Rust-based **Stalwart Mail Server**.

### Step-by-Step Setup:
1. **Unblock Port 25 on Your VPS**:
   Most VPS providers (e.g., Hetzner, DigitalOcean, Contabo) block outbound SMTP on Port 25 by default to prevent spam. You **must** open a support ticket with your VPS provider and ask them to unblock SMTP port 25.
2. **Deploy via Coolify using Docker Compose**:
   * In your Coolify panel, navigate to your Project -> click **New Resource** -> select **Docker Compose**.
   * Copy the configuration from [stalwart-compose.yml](file:///d:/Code/trade-journal/stalwart-compose.yml) in your project root and paste it into the compose configuration.
   * Make sure to change `STALWART_ADMIN_PASSWORD` in the environment variables to a secure password.
   * Under the resource settings, assign your domain (e.g. `https://mail.tradekav.ir`) to target port `8080` (this is the admin/webmail web interface). Coolify's built-in Traefik reverse proxy will automatically fetch an SSL certificate.
3. **Configure DNS Records**:
   You must add the following records in your DNS provider (e.g. Cloudflare) to ensure deliverability:
   * **A Record**: `mail.tradekav.ir` pointing to your VPS IP.
   * **MX Record**: `@` points to `mail.tradekav.ir` (Priority 10).
   * **SPF Record (TXT)**: `v=spf1 ip4:<YOUR_VPS_IP> -all` (tells receiving servers that only your VPS IP is allowed to send email from `@tradekav.ir`).
   * **rDNS (PTR Record)**: Go to your VPS provider dashboard (e.g. Hetzner, Contabo) and set the **Reverse DNS** of your VPS IP address to `mail.tradekav.ir`. Without this, Gmail/Outlook will block your emails.
4. **DKIM and DMARC Setup (via Stalwart Admin Panel)**:
   * Log into your Stalwart Admin UI at `https://mail.tradekav.ir` using the admin credentials you set.
   * Follow the wizard to generate your **DKIM private/public key** for `tradekav.ir`. Stalwart will provide a TXT record.
   * Add this DKIM TXT record and a DMARC TXT record (`v=DMARC1; p=quarantine; pct=100`) to Cloudflare DNS.
   * Once these are active, your emails will be fully verified and authenticated!

---

## Summary Comparison

| Feature | Option A: Cloudflare + Relay | Option B: Dedicated Email Host | Option C: Self-Hosted on VPS |
| :--- | :--- | :--- | :--- |
| **Cost** | 100% Free | Very Low (~$5-$15/year) | Free (uses VPS resources) |
| **Incoming** | Instant setup, routes to Gmail | Professional Webmail / IMAP | Self-managed Webmail / IMAP |
| **Outgoing** | Requires SMTP relay configuration | Out-of-the-box IMAP/SMTP | Out-of-the-box (if Port 25 is open) |
| **Reliability** | High | **Extremely High (Recommended)** | Low (requires active reputation mgmt) |
| **Difficulty** | Easy | Easy | Very Hard |
