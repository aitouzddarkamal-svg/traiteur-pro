# Traiteur Pro — Session Handoff
**Date:** April 24, 2026  
**Live URL:** https://traiteur-pro.netlify.app  
**Supabase:** vsklwzgaiixjvfujprsh.supabase.co  
**Owner:** Kamal Moorish | kamal@moorish-automation.com  

---

## Current State — What's Built ✅

| Feature | File | Status |
|---|---|---|
| Multi-tenant SaaS + RLS | All pages | ✅ |
| Auth + onboarding wizard | Onboarding.jsx | ✅ |
| Self-signup /register | Register.jsx | ✅ |
| Admin client dashboard | AdminClients.jsx | ✅ |
| Admin onboarding form | Settings.jsx | ✅ |
| DGI compliance (ICE/IF/RC/TVA) | Settings.jsx | ✅ |
| Subscription plan gating | plans.js + Layout.jsx | ✅ |
| Negafa/Tiyaba module | PersonnelTraditional.jsx | ✅ |
| 3-day wedding events | EvenementMultiJours.jsx | ✅ |
| Art de la Table | ArtDeLaTable.jsx | ✅ |
| Pâtisserie orientale | Patisserie.jsx | ✅ |
| Category manager (shared) | CategoryManager.jsx | ✅ |
| Stock edit button | Stock.jsx | ✅ |
| WhatsApp buttons | Devis.jsx + Paiements.jsx | ✅ |
| Form validation | Evenements + Paiements + Stock | ✅ |
| Language toggle FR/AR | LangContext + i18n.js | ✅ |
| Shareable devis link | DevisPublic.jsx + devis table | ✅ |
| Client landing page | LandingPage.jsx (per-client) | ✅ |
| Public marketing page | LandingPagePublic.jsx (/landing) | ✅ |
| Mobile sidebar | Layout.jsx | ✅ |
| PWA manifest | public/manifest.json | ✅ |
| Error boundary | App.jsx | ✅ |
| HelpGuide (all routes) | HelpGuide.jsx | ✅ |
| RLS audit + fix | subscriptions table | ✅ |
| Role constraint | users table CHECK constraint | ✅ |

---

## Demo Credentials

| Account | Email | Password | Plan |
|---|---|---|---|
| Owner | kamal@moorish-automation.com | Kamal@Moorish2026! | elite |
| Demo TP | demo@traiteur-pro.com | Demo2026! | elite |
| Youssef | admin@traiteur-youssef.com | Youssef2026! | croissance |
| Chrif | demo@monassabat-chrif.com | Chrif2026! | elite |

**Business IDs:**
- `aaaaaaaa-0000-0000-0000-000000000001` = Demo Traiteur Pro
- `bbbbbbbb-0000-0000-0000-000000000002` = Traiteur Youssef
- `cccccccc-0000-0000-0000-000000000003` = Monassabat Chrif

---

## Pending SQL to Run

```sql
-- Fix plan display for existing clients
UPDATE subscriptions SET plan_id = 'elite'
WHERE business_id = 'cccccccc-0000-0000-0000-000000000003';

UPDATE subscriptions SET plan_id = 'croissance'
WHERE business_id = 'bbbbbbbb-0000-0000-0000-000000000002';

-- Verify
SELECT bp.business_name, s.plan_id 
FROM business_profiles bp
JOIN subscriptions s ON s.business_id = bp.business_id;
```

---

## Pending Features (in order)

### 🔴 Priority 1 — Portail Client /portal/:token
**What:** Public page where a client views their invoice without logging in.  
**How:** 
- Add `token` column to `invoices` table
- Create `src/pages/InvoicePublic.jsx` (similar to DevisPublic.jsx)
- Add public route `/portal/:token` in App.jsx
- Add "Partager lien" button in Factures.jsx

**SQL needed:**
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS token varchar(64) 
  UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');
CREATE INDEX IF NOT EXISTS idx_invoices_token ON invoices(token);
CREATE POLICY "invoices_public_token" ON invoices FOR SELECT USING (true);
```

---

### 🔴 Priority 2 — Plan Upgrade UI in Settings
**What:** Caterers can request a plan upgrade directly from Settings.  
**Where:** New tab "Plan & Facturation" in Settings.jsx  
**Flow:**
```
Show current plan card (green border)
Button: "Mettre à niveau"
Confirmation modal with price
On confirm: UPDATE subscriptions + send WhatsApp to kamal
Success: clear localStorage + redirect to /login
```

---

### 🟠 Priority 3 — Welcome Modal for New Signups
**What:** First-time caterer sees a welcome guide after onboarding.  
**Where:** Dashboard.jsx — show modal if `onboarding_complete` was just set to true.  
**Content:** 3 steps — Add plats → Create event → Generate devis

---

### 🟠 Priority 4 — E-invoice PDF (Elite plan)
**What:** Generate a PDF invoice with ICE/IF/RC/TVA.  
**Library:** jsPDF (npm install jspdf)  
**Where:** Factures.jsx — "Télécharger PDF" button  
**Plan gate:** Elite only

---

### 🟠 Priority 5 — Analytics (10 min task)
**What:** Add Plausible.io tracking script.  
**Where:** index.html `<head>` section  
**Code:**
```html
<script defer data-domain="traiteur-pro.netlify.app" 
  src="https://plausible.io/js/script.js"></script>
```

---

### 🟡 Priority 6 — Email Notifications
**What:** Send emails on key events.  
**Service:** Resend.com (free tier: 3000 emails/month)  
**Events:** New signup → welcome email, Invoice sent → client email  
**Implementation:** Supabase Edge Functions  
**Effort:** 6 hours

---

### 🟡 Priority 7 — Mode Ramadan
**What:** Seasonal dashboard for Iftar/Suhoor packages.  
**Trigger:** Active during Ramadan months (March/April)  
**Features:** Special menu packages, 30-day planning calendar, Iftar pricing

---

### 🟢 Priority 8 — Arabic RTL Full Interface
**What:** Complete Arabic translation of all 20+ pages.  
**Current state:** Sidebar + Dashboard + Événements + Paiements + Stock translated.  
**Remaining:** Plats, Calculateur, Devis, Personnel, ArtDeLaTable, Patisserie, Settings, Comptabilité, Factures, Rapports  
**Effort:** 2-3 days

---

## Architecture Notes

### Hostname Routing
```
traiteur-pro.netlify.app      → SaaS dashboard (in ADMIN_HOSTS)
traiteur-pro-app.netlify.app  → SaaS dashboard (in ADMIN_HOSTS)  
localhost                     → SaaS dashboard (in ADMIN_HOSTS)
[any other hostname]          → Per-client landing page (LandingPage.jsx)
```

**ADMIN_HOSTS in App.jsx:**
```js
const ADMIN_HOSTS = [
  'traiteur-pro.netlify.app',
  'traiteur-pro-app.netlify.app',
  'localhost'
]
```

### Language System
- `src/lib/i18n.js` — translation keys FR + AR
- `src/context/LangContext.jsx` — LangProvider + useLang()
- `src/components/LangToggle.jsx` — 🇲🇦/🇫🇷 toggle button
- Stored in localStorage key: `tp_lang`
- RTL applied to `document.documentElement.dir`

### Shareable Links
- Devis: `/devis/:token` → DevisPublic.jsx
- Invoice (pending): `/portal/:token` → InvoicePublic.jsx
- Token stored in `devis.token` + `invoices.token` columns

### New Client Registration Flow
```
1. /register → creates: users + subscriptions + business_profiles
2. /login → loads profile + plan from Supabase
3. /onboarding → fills business info → sets onboarding_complete=true
4. / → dashboard (full access based on plan)
```

### Public INSERT policies (needed for /register)
```sql
-- Already created:
CREATE POLICY "subscriptions_insert_public" ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "users_insert_public" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "business_profiles_insert_public" ON business_profiles FOR INSERT WITH CHECK (true);
```

---

## Known Issues

| Issue | Status | Fix |
|---|---|---|
| Plans show "Essentiel" for all in /admin | 🔴 Needs SQL fix | Run SQL above |
| Arabic mode breaks LTR pages | ✅ Fixed (direction:'ltr' on Register/Onboarding/Login) | Done |
| Bundle size ~835KB warning | ⚠️ Non-blocking | Add code splitting later |
| Patisserie/Plats pages not in Arabic | ⚠️ Acceptable for launch | Phase 2 |

---

## Build Command
```bash
node_modules/.bin/vite build 2>&1
```

## Deploy
Drag `dist/` folder to netlify.com/drop → select existing `traiteur-pro` project.

---

## Stack Reminder
- React + Vite (NO TypeScript, NO Tailwind)
- CSS: inline ONLY via `const S = {}`
- NEVER: `supabase.auth.getUser()` — always use `profile` from useAuth()
- ALWAYS: `.eq('business_id', profile.business_id)` on every query
- ALWAYS: `business_id: profile.business_id` on every insert
