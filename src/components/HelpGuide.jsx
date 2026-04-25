import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/* ─── Central guide registry — one entry per route ──────────────────────── */
const GUIDES = {
  '/plats': {
    title: 'Comment gérer vos plats',
    steps: [
      "1. Créez d'abord vos ingrédients dans Stock avec leur prix unitaire en MAD — ces prix alimentent automatiquement le calcul de coût des recettes.",
      "2. Cliquez '+ Nouveau plat' — donnez un nom français ET arabe pour un affichage bilingue sur les devis et factures.",
      "3. Définissez la catégorie (créez-en via '⚙ Gérer catégories'), les portions par unité, et le prix de vente unitaire.",
      "4. Cliquez l'icône 🔍 pour ouvrir l'éditeur de recette — ajoutez chaque ingrédient avec sa quantité exacte.",
      "5. La marge est calculée automatiquement : (Prix vente - Coût ingrédients) ÷ Prix vente × 100.",
      "6. Astuce : visez 60-70% de marge pour les plats principaux marocains (tajine, couscous, pastilla).",
    ],
  },
  '/evenements': {
    title: 'Comment gérer vos événements',
    steps: [
      "1. Cliquez '+ Nouvel événement' et liez-le à un client — créez le client si nécessaire.",
      "2. Renseignez : date, nombre d'invités, nombre de tables, et marge souhaitée (10-15% recommandé).",
      "3. Pour un mariage marocain 3 jours, cliquez '🎭 Jours' pour gérer Henna/Nikah/Walima séparément.",
      "4. Dans chaque jour, définissez les invités par session et ajoutez les plats du menu du jour.",
      "5. La liste de courses de chaque jour est générée automatiquement depuis les recettes.",
      "6. Changez le statut Brouillon → Confirmé une fois le contrat signé avec le client.",
    ],
  },
  '/calculateur': {
    title: 'Comment utiliser le calculateur',
    steps: [
      "1. Sélectionnez un événement — invités, tables et marge se chargent automatiquement.",
      "2. Ajoutez les plats prévus — les quantités d'unités nécessaires sont calculées instantanément.",
      "3. Formule appliquée : Unités = (Tables × Invités × (1 + Marge%)) ÷ Portions/unité.",
      "4. Ajustez la marge si nécessaire — chaque modification recalcule en temps réel.",
      "5. Utilisez ces chiffres pour générer la liste de courses via le menu Liste de courses.",
    ],
  },
  '/stock': {
    title: 'Comment gérer votre stock',
    steps: [
      "1. Ajoutez chaque ingrédient avec nom français et arabe, catégorie, unité et prix unitaire MAD.",
      "2. Définissez un seuil d'alerte — une icône ⚠ apparaît quand le stock passe en dessous.",
      "3. Onglet Mouvements : enregistrez chaque entrée (achat) ou sortie (utilisation événement).",
      "4. Onglet Fournisseurs : gérez vos contacts avec nom, téléphone et email.",
      "5. Les prix se synchronisent automatiquement avec les coûts de vos recettes de plats.",
      "6. Astuce : mettez à jour les prix chaque semaine depuis le Marché Central pour une marge précise.",
    ],
  },
  '/art-de-la-table': {
    title: "Comment gérer l'art de la table",
    steps: [
      "1. Créez votre catalogue (b'rad, Ammaria, plateaux, nappes) avec la quantité totale disponible.",
      "2. Onglet 'Par événement' : sélectionnez un événement et assignez les articles nécessaires.",
      "3. Alerte rouge automatique si un article est déjà réservé le même jour pour un autre mariage.",
      "4. Onglet 'Vue d'ensemble' : détectez les conflits de disponibilité entre deux événements simultanés.",
      "5. Cochez 'Retourné' après chaque événement pour remettre l'article en stock disponible.",
      "6. Gérez vos catégories personnalisées via '⚙ Gérer catégories'.",
    ],
  },
  '/patisserie': {
    title: 'Comment gérer la pâtisserie',
    steps: [
      "1. Créez vos recettes avec nom français et arabe, catégorie, taille de fournée et prix/pièce.",
      "2. Cliquez 🧾 pour ajouter les ingrédients avec quantités et coûts — la marge est calculée auto.",
      "3. Visez 70-80% de marge sur les pâtisseries orientales — c'est le segment le plus rentable.",
      "4. Onglet 'Par événement' : planifiez le nombre de fournées nécessaires pour chaque mariage.",
      "5. Indiquez production interne ou externalisée pour un suivi précis des coûts réels.",
      "6. Astuce : Chebakia et Cornes de gazelle représentent 40% du chiffre pâtisserie — priorisez.",
    ],
  },
  '/personnel': {
    title: 'Comment gérer le personnel',
    steps: [
      "1. Onglet Équipe : ajoutez chaque membre avec rôle (Chef, Serveur, Achat, Cuisinier).",
      "2. Onglet Présences : enregistrez présences par événement avec heure arrivée et départ.",
      "3. Onglet Traditionnel : gérez Negafa, Tiyaba, serveurs thé et porteurs — facturation forfait/jour/heure.",
      "4. Sélectionnez un événement dans l'onglet Traditionnel pour calculer la masse salariale cérémoniale.",
      "5. Cliquez '+ Rôles par défaut' pour créer Negafa, Tiyaba, Gnawa en un seul clic.",
    ],
  },
  '/paiements': {
    title: 'Comment suivre les paiements',
    steps: [
      "1. Sélectionnez un événement — le montant total attendu s'affiche automatiquement.",
      "2. Enregistrez l'acompte (30-50% à la signature) avec date et mode de paiement.",
      "3. Enregistrez le solde restant après l'événement terminé.",
      "4. Statut automatique : En attente → Partiellement payé → Soldé.",
      "5. Astuce : notez toujours le mode (espèces, virement CIH/Attijariwafa, chèque) pour votre comptable.",
    ],
  },
  '/devis': {
    title: 'Comment générer un devis',
    steps: [
      "1. Sélectionnez un événement — les plats du calculateur se chargent automatiquement.",
      "2. Ajustez les prix si nécessaire — total HT et TVA se calculent en temps réel.",
      "3. Ajoutez services supplémentaires : location salle, décoration, orchestre.",
      "4. Le PDF inclut vos informations légales (ICE, IF, RC) si renseignées dans Paramètres.",
      "5. Astuce : envoyez par WhatsApp en PDF — 90% des clients marocains préfèrent WhatsApp.",
    ],
  },
  '/settings': {
    title: 'Comment configurer les paramètres',
    steps: [
      "1. Onglet Entreprise : coordonnées affichées sur toutes les factures et devis.",
      "2. Informations légales (Croissance/Élite) : ICE, IF, RC obligatoires pour factures conformes DGI.",
      "3. Onglet Rappels : configurez rappels automatiques J-7 avant événement.",
      "4. Onglet WhatsApp : connectez votre numéro Business pour envoi automatique.",
      "5. Onglet Sécurité : liste des utilisateurs avec accès et demande de restauration de données.",
    ],
  },
}

const S = {
  fab: {
    position: 'fixed',
    bottom: 28,
    right: 28,
    zIndex: 1000,
    background: '#1a5c3a',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background 0.2s, transform 0.15s',
    fontFamily: 'inherit',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1100,
    background: 'rgba(0,0,0,0.25)',
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 340,
    zIndex: 1200,
    background: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  panelHead: {
    background: '#1a5c3a',
    color: '#fff',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    width: 28,
    height: 28,
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  guideTitle: {
    padding: '14px 20px 12px',
    fontSize: 13,
    fontWeight: 700,
    color: '#1a5c3a',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid #f0efeb',
    margin: 0,
  },
  stepList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0 24px',
  },
  step: {
    display: 'flex',
    gap: 12,
    padding: '12px 20px',
    borderBottom: '1px solid #f5f4f1',
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#1a5c3a',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepText: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 1.65,
    margin: 0,
  },
  panelFooter: {
    padding: '14px 20px',
    borderTop: '1px solid #f0efeb',
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    flexShrink: 0,
  },
}

export default function HelpGuide() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const location = useLocation()

  const guide = GUIDES[location.pathname] || null

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!guide) return null

  const steps = guide.steps

  return (
    <>
      <button
        style={S.fab}
        onClick={() => setOpen(true)}
        onMouseEnter={e => { e.currentTarget.style.background = '#155232'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1a5c3a'; e.currentTarget.style.transform = 'none' }}
        aria-label="Ouvrir le guide d'utilisation"
      >
        💡 Aide
      </button>

      {open && (
        <div style={S.overlay} onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div
        ref={panelRef}
        style={{ ...S.panel, transform: open ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Guide d'utilisation"
      >
        <div style={S.panelHead}>
          <h2 style={S.headTitle}>
            <span>📖</span> Guide d'utilisation
          </h2>
          <button
            style={S.closeBtn}
            onClick={() => setOpen(false)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div style={S.guideTitle}>{guide.title}</div>

        <div style={S.stepList}>
          {steps.map((text, i) => (
            <div key={i} style={S.step}>
              <div style={S.stepNum}>{i + 1}</div>
              <p style={S.stepText}>{text.replace(/^\d+\.\s*/, '')}</p>
            </div>
          ))}
        </div>

        <div style={S.panelFooter}>
          Appuyez sur <kbd style={{ background: '#f0efeb', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>Échap</kbd> pour fermer
        </div>
      </div>
    </>
  )
}
