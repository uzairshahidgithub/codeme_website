# Codemo Auth Email Templates

These templates are version-controlled in this repo but **applied via the Supabase Dashboard** (Auth → Email Templates). Supabase Auth does not yet support email-template-as-config.

## Mapping

| Dashboard slot | File | Subject |
|---|---|---|
| Confirm signup | [confirm-signup.html](confirm-signup.html) | `Confirm your Codemo account` |
| Magic link | [magic-link.html](magic-link.html) | `Your Codemo sign-in link` |
| Reset password | [recovery.html](recovery.html) | `Reset your Codemo password` |
| Change email address | [email-change.html](email-change.html) | `Confirm your new Codemo email` |

## How to apply

1. Open the Supabase Dashboard → **Authentication → Email Templates**.
2. For each row in the table above:
   - Set the subject exactly as shown.
   - Open the matching `.html` file from this folder.
   - Copy the file contents into the dashboard's HTML body editor (replace any existing default).
   - **Sender name:** `Codemo Teams`. **Sender email:** `noreply@codemoteam.org` (must match the verified Postal sender domain).
3. Click **Save** on each tab.

## Variables used

The templates use Supabase's Go-template variables:

* `{{ .ConfirmationURL }}` — the magic action link, already includes the token
* `{{ .Email }}` — recipient email
* `{{ .NewEmail }}` — only available in the email-change template

Do **not** invent new variables. Anything outside the list above is rendered literally.

## When updating a template

1. Edit the `.html` file in this folder, commit on branch `supabase`.
2. Re-paste into the Dashboard for each affected slot.
3. Send a self-test from `Authentication → Users → Send invite` (or trigger a real signup) to verify rendering across Gmail, Apple Mail and Outlook.
