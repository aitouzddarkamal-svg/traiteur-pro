# CLAUDE.md — Traiteur Pro / Catering Pro
## Instructions for Claude Code

---

## WHO I AM
Kamal, automation consultant in Agadir Morocco, brand Moorish Automation.
Building two SaaS apps: Traiteur Pro (FR) and Catering Pro (EN).

---

## STACK (NON-NEGOTIABLE)
- React + Vite — NO TypeScript, NO Next.js
- CSS: inline ONLY via `const S = {}` — NEVER Tailwind, NEVER CSS files
- Backend: Supabase — vsklwzgaiixjvfujprsh.supabase.co
- Auth: Custom profile from users table, localStorage key `tp_profile`
- Routing: React Router DOM
- Deploy: Netlify Drop (drag dist/)

---

## CRITICAL RULES

### CSS
```js
// ✅ ALWAYS
const S = { page: { padding: '2rem' }, title: { fontSize: '1.5rem' } }
<div style={S.page}>

// ❌ NEVER
import styles from './page.module.css'
className="flex items-center"  // No Tailwind
```

### Supabase Auth
```js
// ✅ ALWAYS use profile from context
const { profile } = useAuth();

// ❌ NEVER use this
const { data } = await supabase.auth.getUser();
```

### Business ID (CRITICAL)
```js
// ✅ EVERY insert must have business_id
await supabase.from('events').insert({
  business_id: profile.business_id,  // REQUIRED
  name: form.name,
})

// ✅ EVERY query must filter by business_id
await supabase.from('events')
  .select('*')
  .eq('business_id', profile.business_id)  // REQUIRED
```

### localStorage
```js
// ✅ Only one key allowed
localStorage.setItem('tp_profile', JSON.stringify(profile))

// ❌ Never store business data
localStorage.setItem('events', JSON.stringify(data))  // FORBIDDEN
```

---

## BUILD COMMAND
```bash
# Always use this — npm run build exits with code 127
node_modules/.bin/vite build 2>&1
```

---

## FILE STRUCTURE
```
src/
  components/
    Layout.jsx          # Sidebar + nav + DemoBanner + UpgradeBanner
    CategoryManager.jsx # Shared: module='rental'|'pastry'
    HelpGuide.jsx       # Auto-detects route via useLocation()
  context/
    AuthContext.jsx     # useAuth() → profile.role, business_id, plan_id
  lib/
    supabaseClient.js
    permissions.js      # canDo(role, action)
    plans.js            # essentiel/croissance/elite nav arrays
  pages/
    [see project docs]
```

---

## PERMISSIONS
```js
import { canDo } from '../lib/permissions';
const canCreate = canDo(profile?.role, 'canCreate');
const canDelete = canDo(profile?.role, 'canDelete');

// Buttons: HIDE when no permission (never just disable)
{canCreate && <button onClick={handleAdd}>+ Ajouter</button>}
{canDelete && <button onClick={handleDelete}>✕</button>}
```

| Role | canCreate | canEdit | canDelete | canViewFinances |
|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ |
| chef | ❌ | ✅ | ❌ | ❌ |
| waiter | ❌ | ❌ | ❌ | ❌ |
| purchasing | ✅ | ✅ | ❌ | ❌ |
| viewer | ❌ | ❌ | ❌ | ❌ |

---

## PLAN GATING
```js
// In plans.js — nav arrays per plan
essentiel:  ['dashboard','plats','stock','artdelatable','patisserie','settings']
croissance: [...essentiel, 'calculateur','evenements','devis','paiements','liste','personnel']
elite:      [...croissance, 'comptabilite','factures','rapports']
```

---

## ADMIN-ONLY FEATURES
```js
// Only visible to the webapp owner
const isOwner = profile?.email === 'kamal@moorish-automation.com';
```

---

## DATABASE PATTERN
```sql
-- RLS policy for every table:
CREATE POLICY "table_biz" ON table_name
  USING (business_id = (SELECT business_id FROM users WHERE id = auth.uid()));

-- Exception: users table has RLS DISABLED (intentional — avoids recursion)
-- Exception: subscriptions table has its own RLS policy
```

### Business IDs (demo data):
- `aaaaaaaa-0000-0000-0000-000000000001` = Demo Traiteur Pro (elite)
- `bbbbbbbb-0000-0000-0000-000000000002` = Traiteur Youssef (croissance)
- `cccccccc-0000-0000-0000-000000000003` = Monassabat Chrif (elite)

---

## SQL RULES
```sql
-- ALWAYS use IF NOT EXISTS
ALTER TABLE t ADD COLUMN IF NOT EXISTS col varchar(20);

-- NEVER do this (gives each user a different UUID)
UPDATE users SET business_id = gen_random_uuid();

-- ALWAYS use slug or known UUID to target specific rows
UPDATE business_profiles SET ice = '...' WHERE slug = 'monassabat-chrif';
```

---

## DEMO CREDENTIALS
| Account | Email | Password | Plan |
|---|---|---|---|
| Owner | kamal@moorish-automation.com | Kamal@Moorish2026! | elite |
| Demo TP | demo@traiteur-pro.com | Demo2026! | elite |
| Youssef | admin@traiteur-youssef.com | Youssef2026! | croissance |
| Chrif | demo@monassabat-chrif.com | Chrif2026! | elite |
| Catering | demo@catering-pro.com | CateringPro2026! | elite |

---

## CURRENT PRIORITIES (April 2026)
1. WhatsApp button in Devis + Paiements — 30 min
2. Form validation on all forms — 4 hours
3. Self-signup /register page — 3 hours
4. Language toggle FR/AR — 3 hours
5. Client landing page (per-client white-label) — 3 hours
6. Shareable devis link — 2 hours

---

## WHAT NOT TO DO
- NO TypeScript (.tsx files)
- NO Tailwind classes
- NO MUI / Chakra / Ant Design / shadcn
- NO localStorage except tp_profile
- NO supabase.auth.getUser()
- NO separate Supabase projects per client
- NO Git/CI/CD suggestions — use Netlify Drop
- NO Next.js suggestions — this is React + Vite only
- NO subdomain routing on Netlify Free plan
