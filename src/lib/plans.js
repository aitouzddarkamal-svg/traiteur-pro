export const PLANS = {
  essentiel: {
    label: "L'Essentiel",
    nav: ['dashboard', 'plats', 'stock', 'artdelatable', 'patisserie', 'settings'],
    features: ['dishes', 'stock_basic', 'landing_page'],
  },
  croissance: {
    label: 'Le Plan Croissance',
    nav: ['dashboard', 'calculateur', 'plats', 'evenements', 'devis',
          'paiements', 'liste', 'stock', 'artdelatable', 'patisserie', 'personnel', 'settings'],
    features: ['dishes', 'stock_basic', 'landing_page',
               'events', 'inventory_rental', 'suppliers_basic'],
  },
  elite: {
    label: 'Le Plan Élite Enterprise',
    nav: ['dashboard', 'calculateur', 'plats', 'evenements', 'devis',
          'paiements', 'liste', 'stock', 'artdelatable', 'patisserie', 'personnel',
          'comptabilite', 'factures', 'rapports', 'settings'],
    features: ['dishes', 'stock_basic', 'landing_page',
               'events', 'inventory_rental', 'suppliers_basic',
               'finance', 'supplier_portal', 'pastry', 'florals'],
  },
}

export function canAccessFeature(plan_id, feature) {
  return PLANS[plan_id]?.features?.includes(feature) ?? false
}

export function getPlanNav(plan_id) {
  return PLANS[plan_id]?.nav || PLANS.essentiel.nav
}
