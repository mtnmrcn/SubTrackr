# Supabase Password Reset Konfiguration

## 📋 Erforderliche Schritte im Supabase Dashboard

### 1. **Email Templates konfigurieren**

1. Gehe zu **Authentication** → **Email Templates** im Supabase Dashboard
2. Wähle **Reset Password** Template aus
3. Stelle sicher, dass der Reset-Link korrekt ist:

```
{{ .ConfirmationURL }}
```

### 2. **Redirect URLs konfigurieren**

1. Gehe zu **Authentication** → **URL Configuration**
2. Füge folgende **Redirect URLs** hinzu:

**Für lokale Entwicklung:**
```
http://localhost:5173/reset-password
http://localhost:5173
```

**Für Production:**
```
https://deine-domain.com/reset-password
https://deine-domain.com
```

3. **Site URL** setzen:
   - Lokal: `http://localhost:5173`
   - Production: `https://deine-domain.com`

### 3. **Email Provider konfigurieren**

1. Gehe zu **Project Settings** → **Auth**
2. Stelle sicher, dass ein Email Provider konfiguriert ist:
   - **Supabase (Standard)**: Funktioniert out-of-the-box, aber limitiert
   - **Eigener SMTP**: Empfohlen für Production
     - SendGrid
     - AWS SES
     - Mailgun
     - etc.

### 4. **SMTP Konfiguration (Optional, aber empfohlen für Production)**

1. Gehe zu **Project Settings** → **Auth** → **SMTP Settings**
2. Enable Custom SMTP
3. Konfiguriere:
   ```
   Host: smtp.dein-provider.com
   Port: 587 (oder 465 für SSL)
   Username: dein-smtp-username
   Password: dein-smtp-password
   Sender Email: noreply@deine-domain.com
   Sender Name: SubTrackr
   ```

### 5. **Rate Limiting prüfen**

1. Gehe zu **Project Settings** → **Auth** → **Rate Limits**
2. Stelle sicher, dass die Limits angemessen sind:
   - Password Recovery: 5 requests per 15 minutes (empfohlen)

## 🔧 Code-Konfiguration

### redirectTo Parameter

In `ForgotPassword.jsx` wird automatisch die richtige URL verwendet:

```javascript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
})
```

- **Lokal**: `http://localhost:5173/reset-password`
- **Production**: `https://deine-domain.com/reset-password`

## 🧪 Testing

### 1. **Lokal testen:**

```bash
npm run dev
```

1. Gehe zu Login-Seite
2. Klicke "Passwort vergessen?"
3. Gib E-Mail ein
4. Prüfe E-Mail-Postfach (auch Spam!)
5. Klicke auf Reset-Link in E-Mail
6. Setze neues Passwort
7. Prüfe ob Redirect zum Dashboard funktioniert

### 2. **E-Mail nicht erhalten?**

**Mögliche Probleme:**
- E-Mail im Spam-Ordner
- Falsche E-Mail-Adresse eingegeben
- Supabase Email Provider Rate Limit erreicht
- SMTP nicht korrekt konfiguriert

**Debugging:**
1. Prüfe Supabase Dashboard → Logs → Auth Logs
2. Prüfe Browser Console für Fehler
3. Prüfe Network Tab für API-Fehler

### 3. **Reset-Link funktioniert nicht?**

**Mögliche Probleme:**
- Redirect URL nicht in Supabase konfiguriert
- Hash-Parameter fehlen in URL
- Token abgelaufen (Standard: 1 Stunde)

**Lösung:**
1. Prüfe ob URL `#type=recovery` enthält
2. Prüfe Supabase Redirect URLs
3. Fordere neuen Reset-Link an

## 📧 E-Mail Template Anpassen (Optional)

### Standard Template:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

### Angepasstes Template (Deutsch):

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #8b5cf6;">Passwort zurücksetzen - SubTrackr</h2>
  <p>Du hast einen Link zum Zurücksetzen deines Passworts angefordert.</p>
  <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
  <p>
    <a href="{{ .ConfirmationURL }}"
       style="background: linear-gradient(to right, #8b5cf6, #3b82f6);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              display: inline-block;">
      Passwort zurücksetzen
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.
  </p>
  <p style="color: #666; font-size: 12px;">
    Dieser Link ist 1 Stunde gültig.
  </p>
</div>
```

## 🔐 Sicherheit

### Best Practices:

1. **Token Expiration**: Standard 1 Stunde - gut so!
2. **Rate Limiting**: Maximal 5 Anfragen pro 15 Minuten
3. **HTTPS**: Immer in Production verwenden
4. **Email Verification**: Stellt sicher dass nur verifizierte E-Mails funktionieren

### Wichtige Hinweise:

- Zeige NIEMALS ob ein Account existiert oder nicht (Security by Obscurity)
- Daher die Nachricht: "Falls ein Account existiert, erhältst du eine E-Mail"
- Verhindert Account Enumeration Angriffe

## 🚀 Production Checklist

- [ ] Custom SMTP konfiguriert
- [ ] Redirect URLs für Production-Domain hinzugefügt
- [ ] Site URL auf Production-Domain gesetzt
- [ ] E-Mail Template angepasst (optional)
- [ ] Rate Limits geprüft
- [ ] HTTPS aktiviert
- [ ] Domain verifiziert bei Email Provider
- [ ] SPF/DKIM Records gesetzt (für bessere Email Deliverability)
- [ ] Funktionalität getestet

## 📚 Weitere Ressourcen

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Password Reset Flow](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
