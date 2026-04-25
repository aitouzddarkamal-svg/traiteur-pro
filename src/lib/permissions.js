export const ROLE_PERMISSIONS = {
  admin: {
    nav: ['dashboard','calculateur','plats','evenements','devis','paiements',
          'liste','stock','personnel','comptabilite','factures','rapports','settings'],
    canCreate: true,
    canEdit:   true,
    canDelete: true,
    canViewFinances: true,
  },
  chef: {
    nav: ['dashboard','calculateur','plats','evenements','devis','paiements',
          'liste','stock','personnel','comptabilite','factures','rapports','settings'],
    canCreate: false,
    canEdit:   true,
    canDelete: false,
    canViewFinances: false,
  },
  purchasing: {
    nav: ['dashboard','calculateur','liste','stock'],
    canCreate: true,
    canEdit:   true,
    canDelete: false,
    canViewFinances: false,
  },
  waiter: {
    nav: ['dashboard','evenements','personnel'],
    canCreate: false,
    canEdit:   false,
    canDelete: false,
    canViewFinances: false,
  },
  viewer: {
    nav: ['dashboard','evenements'],
    canCreate: false,
    canEdit:   false,
    canDelete: false,
    canViewFinances: false,
  },
}

const NAV_LABELS = {
  dashboard:    { labelFr: 'Tableau de bord',  icon: '🏠' },
  calculateur:  { labelFr: 'Calculateur',       icon: '🧮' },
  plats:        { labelFr: 'Plats',             icon: '🍽' },
  evenements:   { labelFr: 'Événements',        icon: '📅' },
  devis:        { labelFr: 'Devis',             icon: '📄' },
  paiements:    { labelFr: 'Paiements',         icon: '💰' },
  liste:        { labelFr: 'Liste de courses',  icon: '🛒' },
  stock:        { labelFr: 'Stock',             icon: '📦' },
  personnel:    { labelFr: 'Personnel',         icon: '👥' },
  comptabilite: { labelFr: 'Comptabilité',      icon: '📊' },
  factures:     { labelFr: 'Factures',          icon: '🧾' },
  rapports:     { labelFr: 'Rapports',          icon: '📈' },
  settings:     { labelFr: 'Paramètres',        icon: '⚙️' },
}

export function getNavItems(role = 'waiter') {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.waiter
  return perms.nav.map(key => ({ key, ...NAV_LABELS[key] }))
}

export function canDo(role = 'waiter', action) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer
  return !!perms[action]
}