# Postal SMTP — Oracle Cloud Always-Free Setup

End-to-end provisioning of `mail.codemoteam.org` and `postal.codemoteam.org` on a free Oracle Cloud VM. Total runtime: ~45 minutes including DNS propagation.

## 0. Prerequisites

* Cloudflare DNS already authoritative for `codemoteam.org`.
* SSH keypair generated locally (`~/.ssh/id_ed25519` recommended).
* Resend (and any other paid email provider) cancelled or unused — this guide replaces it.

---

## 1. Provision the Oracle Cloud Always-Free VM

1. Sign in at <https://cloud.oracle.com>.
2. **Compute → Instances → Create instance**:
   * **Image:** `Canonical Ubuntu 22.04` (Always Free Eligible).
   * **Shape:** `VM.Standard.A1.Flex` — 4 OCPU, 24 GB RAM (Always Free for ARM).
   * **Boot volume:** 50 GB (Always Free includes 200 GB total).
   * **Networking:** create a new VCN, attach a public subnet, **assign a public IPv4**.
   * **SSH keys:** paste your public key.
3. After the instance reaches `RUNNING`, note the public IPv4 — we'll call it `<ORACLE_VM_PUBLIC_IP>`.

### Open the firewall

OCI runs both an instance-level firewall (iptables/ufw) and a VCN-level Security List. Open both:

**Security list (Console → VCN → \[your subnet\] → Default Security List → Add ingress rules):**

| Source | Protocol | Port | Description |
|---|---|---|---|
| `0.0.0.0/0` | TCP | `22` | SSH |
| `0.0.0.0/0` | TCP | `25` | SMTP |
| `0.0.0.0/0` | TCP | `587` | SMTP submission |
| `0.0.0.0/0` | TCP | `465` | SMTPS |
| `0.0.0.0/0` | TCP | `80` | HTTP (Certbot ACME challenge) |
| `0.0.0.0/0` | TCP | `443` | HTTPS (web UI) |

**Instance firewall:** Ubuntu's `iptables` rules ship locked down on Oracle. SSH in and run:

```bash
sudo iptables -I INPUT -p tcp -m multiport --dports 25,80,443,465,587 -j ACCEPT
sudo netfilter-persistent save
```

### Set rDNS / PTR

In OCI Console → **Compute → Instances → \[your VM\] → Edit DNS** → set **Reverse DNS Hostname** to `mail.codemoteam.org`. Without this, Gmail and M365 reject inbound mail from the VM.

---

## 2. Add Cloudflare DNS records

Apply every record from [`dns-records.md`](dns-records.md). Verify with the `dig` commands at the bottom of that file before continuing.

---

## 3. Install Docker and Certbot on the VM

```bash
ssh ubuntu@<ORACLE_VM_PUBLIC_IP>

# Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

---

## 4. Issue Let's Encrypt certificates

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone \
  -d mail.codemoteam.org \
  -d postal.codemoteam.org \
  --agree-tos --register-unsafely-without-email --non-interactive
sudo systemctl start nginx
```

Auto-renewal is wired up by the Certbot package. Verify:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

---

## 5. Clone this repo's `smtp/` folder onto the VM

```bash
git clone https://github.com/uzairshahidgithub/Codemo-Website.git
cd Codemo-Website/smtp
cp .env.example .env
# Edit .env: fill MARIADB_*  passwords (openssl rand -hex 24)
nano .env
```

---

## 6. First boot of Postal

```bash
docker compose pull
docker compose up -d postal-mariadb postal-redis

# Wait for MariaDB to be healthy
docker compose ps

# Initialise Postal's databases
docker compose run --rm postal-runner postal initialize

# Start everything
docker compose up -d

# Create the first admin user
docker compose run --rm postal-runner postal make-user
# Follow the interactive prompts — use admin@codemoteam.org
```

---

## 7. Configure nginx reverse proxy for the web UI

```bash
sudo tee /etc/nginx/sites-available/postal > /dev/null <<'EOF'
server {
    listen 80;
    server_name postal.codemoteam.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name postal.codemoteam.org;

    ssl_certificate /etc/letsencrypt/live/mail.codemoteam.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.codemoteam.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/postal /etc/nginx/sites-enabled/postal
sudo nginx -t && sudo systemctl reload nginx
```

Visit <https://postal.codemoteam.org> and sign in with the admin user from step 6.

---

## 8. Provision the Codemo mail server in the Postal UI

1. **Organisations → New Organisation** → name `Codemo`.
2. **Servers → New Server** → name `codemo-prod`, mode `Live`.
3. **Domains → Add Domain** → `codemoteam.org`. Postal generates DNS records — those are already added in step 2 of this guide. Click **Verify**.
4. **Credentials → New Credential** → type `SMTP`. Save the username and password — these are the relay credentials the Edge Function uses.

---

## 9. Wire credentials into Supabase

Locally, populate `supabase/functions/.env` from `.env.example`:

```
SUPABASE_URL=https://<your-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SMTP_HOST=mail.codemoteam.org
SMTP_PORT=587
SMTP_USER=<from Postal credential>
SMTP_PASS=<from Postal credential>
EMAIL_FROM=noreply@codemoteam.org
TURNSTILE_SECRET_KEY=...
```

Push to Supabase:

```bash
supabase secrets set --env-file ./supabase/functions/.env
pnpm functions:deploy send-email
```

---

## 10. Wire the same credentials into Supabase Auth → SMTP

Dashboard → **Project Settings → Auth → SMTP Settings**:

| Field | Value |
|---|---|
| Sender name | `Codemo Teams` |
| Sender email | `noreply@codemoteam.org` |
| Host | `mail.codemoteam.org` |
| Port | `587` |
| Username | _from Postal credential_ |
| Password | _from Postal credential_ |

This switches Supabase Auth's confirmation/recovery/magic-link emails through Postal as well.

---

## 11. End-to-end smoke test

1. **Postal UI:** Server → Test → send a message to your personal address. Should arrive within seconds, headers show DKIM `pass`.
2. **Edge Function:** invoke `send-email` from the frontend (e.g. via `frontend/lib/email.ts`). Check the `audit_log` table for an `email.sent` row.
3. **Supabase Auth:** trigger a password recovery from `/auth/reset-password`. Check inbox.
4. **Deliverability scoring:** send a message from Postal to `check-auth@verifier.port25.com`. The reply scores SPF, DKIM, DMARC and rDNS — all four must pass.

If any of the four fail, fix at the DNS or PTR layer (see [`dns-records.md`](dns-records.md)) before going live.

---

## Operational notes

* **Backups:** `mariadb-data` volume holds Postal's metadata. Snapshot the boot volume nightly via OCI's free backup policy, or cron `mysqldump` to S3-compatible storage.
* **Updates:** `docker compose pull && docker compose up -d` — Postal v3 images are tagged with the major version.
* **Logs:** `docker compose logs -f postal-smtp` for SMTP, `... postal-worker` for queue.
* **Certbot renewals:** every 60 days; `systemctl status certbot.timer` confirms.
* **Resource ceiling:** the Always-Free Ampere shape comfortably handles ~10k messages/day. Beyond that, scale OCPU or split SMTP and DB onto two VMs.

---

## Cost

* Oracle Cloud Always-Free VM: £0/month (forever, if you use the ARM Ampere shape).
* Domain: ~£8/year.
* Resend, SendGrid, Mailgun: cancelled. £0/month.

Total: domain only.
