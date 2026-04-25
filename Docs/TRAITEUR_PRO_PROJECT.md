# Traiteur Pro — Project Documentation
**Owner:** Kamal Moorish | Moorish Automation, Agadir  
**Last updated:** April 2026

---

## 1. Project Overview

Traiteur Pro is a multi-tenant SaaS platform for Moroccan catering businesses.  
Two deployments: **Traiteur Pro** (FR) and **Catering Pro** (EN/international).

**Live URL:** https://traiteur-pro-demo.netlify.app  
**Supabase:** vsklwzgaiixjvfujprsh.supabase.co

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| CSS | Inline only via `const S = {}` |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Routing | React Router DOM v6 |
| Deploy | Netlify Drop (drag dist/) |
| Fonts | Playfair Display + DM Sans (Google Fonts) |

**Rules:**
- NO TypeScript
- NO Tailwind
- NO external UI libraries (no MUI, Chakra, Ant Design)
- CSS always inline: `style={S.someKey}`

---

## 3. Project Structure

```
src/
  components/
    Layout.jsx          # Sidebar + DemoBanner + UpgradeBanner
    CategoryManager.jsx # Shared category CRUD (rental + pastry)
    HelpGuide.jsx       # Floating 💡 Aide button (auto-detects route)
  context/
    AuthContext.jsx     # Auth + profile + plan_id loader
  lib/
    supabaseClient.js
    permissions.js      # canDo(role, action)
    plans.js            # PLANS config — essentiel/croissance/elite
  pages/
    Login.jsx, Dashboard.jsx, Evenements.jsx, EvenementMultiJours.jsx
    Paiements.jsx, Personnel.jsx, PersonnelTraditional.jsx
    Plats.jsx, Calculateur.jsx, ListeCourses.jsx
    Stock.jsx, Devis.jsx, Facture.jsx, Comptabilite.jsx
    Rapport.jsx, Settings.jsx, LandingPage.jsx, LandingPagePublic.jsx
    ArtDeLaTable.jsx, Patisserie.jsx
    Onboarding.jsx, AdminClients.jsx
```

---

## 4. Demo Credentials

| Account | Email | Password | Plan | Business ID |
|---|---|---|---|---|
| Owner (Kamal) | kamal@moorish-automation.com | Kamal@Moorish2026! | elite | aaaaaaaa-0001 |
| Demo Traiteur Pro | demo@traiteur-pro.com | Demo2026! | elite | aaaaaaaa-0001 |
| Traiteur Youssef | admin@traiteur-youssef.com | Youssef2026! | croissance | bbbbbbbb-0002 |
| Youssef Chef | chef@traiteur-youssef.com | Youssef2026! | croissance | bbbbbbbb-0002 |
| Monassabat Chrif | demo@monassabat-chrif.com | Chrif2026! | elite | cccccccc-0003 |
| Catering Pro | demo@catering-pro.com | CateringPro2026! | elite | aaaaaaaa-0001 |

**Business IDs (short):**
- `aaaaaaaa-0000-0000-0000-000000000001` = Demo Traiteur Pro
- `bbbbbbbb-0000-0000-0000-000000000002` = Traiteur Youssef
- `cccccccc-0000-0000-0000-000000000003` = Monassabat Chrif

---

## 5. Subscription Plans

| Plan | Price | Nav Modules |
|---|---|---|
| `essentiel` | 199 MAD/mois | dashboard, plats, stock, artdelatable, patisserie, settings |
| `croissance` | 399 MAD/mois | + calculateur, evenements, devis, paiements, liste, personnel |
| `elite` | 699 MAD/mois | + comptabilite, factures, rapports |

---

## 6. Role Permissions

| Role | canCreate | canEdit | canDelete | canViewFinances |
|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ |
| chef | ❌ | ✅ | ❌ | ❌ |
| waiter | ❌ | ❌ | ❌ | ❌ |
| purchasing | ✅ | ✅ | ❌ | ❌ |
| viewer | ❌ | ❌ | ❌ | ❌ |

---

## 7. Auth Flow

```
1. Login → supabase.auth.signInWithPassword()
2. Fetch profile → .from('users').select('*').eq('id', session.user.id).single()
3. Fetch plan → .from('subscriptions').select('plan_id').eq('business_id', ...).single()
4. Store in localStorage key: tp_profile
5. Check onboarding_complete → redirect to /onboarding if false
6. All pages use useAuth() → profile.role, business_id, plan_id
```

**NEVER use:** `supabase.auth.getUser()` — always use `profile` from context.

---

## 8. Database Tables

All tables have `business_id` (uuid) for multi-tenancy + RLS.

### Core tables:
- `users` — id, name, email, role, business_id, is_active
- `clients` — linked to business
- `events` — linked to clients + business
- `invoices` + `invoice_items`
- `payments`

### Recipe & Stock:
- `dishes` + `dish_ingredients` + `ingredients`
- `stock_movements` + `suppliers`

### Moroccan-specific:
- `traditional_roles` + `event_traditional_staff` (Negafa/Tiyaba)
- `event_days` + `event_day_dishes` (3-day weddings)
- `rental_items` + `event_rental_items` (Art de la Table)
- `pastry_recipes` + `pastry_ingredients` + `event_pastry_orders`
- `item_categories` (shared: rental + pastry, module field)

### Business & Subscriptions:
- `subscriptions` — business_id, plan_id
- `business_profiles` — slug, hostname, business_name, tagline, primary_color, ice, if_num, rc, patente, cnss, tva_default, logo_url, cover_image_url, gallery, onboarding_complete
- `restore_requests` — backup restore requests

---

## 9. RLS Policy Pattern

```sql
-- Standard pattern for all tables:
CREATE POLICY "table_biz" ON table_name
  USING (business_id = (SELECT business_id FROM users WHERE id = auth.uid()));

-- Exception: users table (uses id directly)
USING (id = auth.uid())

-- Note: users table has RLS DISABLED to avoid recursion
-- Auth managed at app level instead
```

---

## 10. Multi-Tenancy

- Every table has `business_id` column
- RLS policies enforce data isolation automatically
- App-level: every query has `.eq('business_id', profile.business_id)`
- Every INSERT includes `business_id: profile.business_id`

---

## 11. Important Conventions

```js
// ✅ CORRECT
const { profile } = useAuth();
supabase.from('events').select('*').eq('business_id', profile.business_id)

// ❌ NEVER DO THIS
supabase.auth.getUser()
localStorage.setItem('events', data) // only tp_profile allowed
```

---

## 12. Admin-Only Features

Visible only when `profile.email === 'kamal@moorish-automation.com'`:
- `/admin` route → AdminClients.jsx (client dashboard)
- Settings → "Nouveau client" tab (one-click onboarding)
- Settings → "Sécurité" full panel

---

## 13. Completed Features ✅

| Feature | File | Status |
|---|---|---|
| Demo banner | Layout.jsx | ✅ |
| Subscription nav gating | plans.js + Layout.jsx | ✅ |
| Multi-tenancy + RLS | All pages | ✅ |
| Dark mode dashboard | Dashboard.jsx | ✅ |
| Onboarding wizard | Onboarding.jsx | ✅ |
| Admin client dashboard | AdminClients.jsx | ✅ |
| DGI compliance (ICE/IF/RC/TVA) | Settings.jsx | ✅ |
| Negafa/Tiyaba module | PersonnelTraditional.jsx | ✅ |
| 3-day wedding events | EvenementMultiJours.jsx | ✅ |
| Art de la Table | ArtDeLaTable.jsx | ✅ |
| Pâtisserie orientale | Patisserie.jsx | ✅ |
| Category manager (shared) | CategoryManager.jsx | ✅ |
| Stock edit button | Stock.jsx | ✅ |
| Help guide (all routes) | HelpGuide.jsx | ✅ |
| Mobile sidebar | Layout.jsx | ✅ |
| PWA manifest | public/manifest.json | ✅ |
| Public landing page | LandingPagePublic.jsx | ✅ |
| Error boundary | App.jsx | ✅ |

---

## 14. Pending Features ⏳

| Priority | Feature | Effort |
|---|---|---|
| 🔴 High | WhatsApp button in Devis + Paiements | 30 min |
| 🔴 High | Form validation (all forms) | 4 hours |
| 🔴 High | Self-signup /register page | 3 hours |
| 🟠 Medium | Language toggle FR/AR | 3 hours |
| 🟠 Medium | Client landing page (per-client white-label) | 3 hours |
| 🟠 Medium | Shareable devis link | 2 hours |
| 🟠 Medium | Portail client /portal/:token | 3 hours |
| 🟡 Low | E-invoice PDF (Elite plan) | 4 hours |
| 🟡 Low | Mode Ramadan | 4 hours |
| 🟡 Low | Email notifications (Resend.com) | 6 hours |
| 🟡 Low | Analytics (Plausible.io) | 10 min |
| 🟢 Future | Arabic RTL full interface | 1 week |
| 🟢 Future | WhatsApp automation (full) | 1 week |

---

## 15. Deployment

**Process:**
```bash
npm run build
# → drag dist/ folder to netlify.com/drop
```

**Netlify config:**
- File: `public/_redirects`
- Content: `/* /index.html 200`

**Environment:** No .env needed — Supabase keys are in `src/lib/supabaseClient.js`

---

## 16. Build Command

```bash
# Always use this — npm run build exits with code 127
node_modules/.bin/vite build 2>&1
```

Bundle size: ~814 kB JS (chunk-size warning only, not an error)

---

## 17. New Client Onboarding (Manual Flow)

1. Login as `kamal@moorish-automation.com`
2. Go to Paramètres → Nouveau client tab
3. Fill: Nom, Email, Mot de passe, Plan, Ville, Slug
4. Click "Créer le compte client"
5. Copy the generated credentials and send via WhatsApp

---

## 18. Contact

**Kamal Moorish**  
Moorish Automation  
Agadir, Maroc  
kamal@moorish-automation.com
