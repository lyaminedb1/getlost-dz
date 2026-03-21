# 🏔️ Get Lost DZ — Plateforme de Voyage Algérienne

> Connecter les voyageurs aux meilleures agences locales d'Algérie pour des expériences authentiques.

**Production** : [getlost-dz.onrender.com](https://getlost-dz.onrender.com)

---

## 🛠 Stack technique

| Couche | Technologies |
|--------|-------------|
| **Backend** | Python / Flask, JWT auth, bcrypt |
| **Base de données** | PostgreSQL (production) · SQLite (développement) |
| **Frontend** | React 18, Vite, CSS-in-JS |
| **Images** | Cloudinary (upload, HEIC→JPG) |
| **Déploiement** | Render.com |

**Design** : Teal `#0DB9A8` · Navy `#0B2340` · Poppins + Nunito

## ✨ Fonctionnalités

- **Landing page** — Hero plein écran avec slider d'images, stats animées au scroll, section "Comment ça marche" en 3 étapes, témoignages, CTA
- **Catalogue de voyages** — Filtres avancés (catégorie, prix, durée, région), tri, recherche
- **Page offre dédiée** — Galerie d'images, programme, inclus, dates, réservation, avis
- **Partage social** — Boutons WhatsApp, Facebook, copier le lien sur chaque offre
- **Système d'avis** — Notes + commentaires voyageurs, réponses agences
- **Favoris / Wishlist** — ❤️ par voyageur
- **Chat intégré** — Messagerie agence ↔ voyageur
- **Notifications** — Cloche + polling temps réel
- **Dashboard agence** — Gestion offres, réservations, analytics, profil
- **Admin panel** — Validation offres, gestion agences/users/avis, analytics globales
- **Auth complète** — JWT, inscription, connexion, mot de passe oublié, pages dédiées
- **Upload images** — Avatar + galerie offres (max 6), conversion HEIC→JPG via Cloudinary
- **Profil agence public** — Page dédiée avec infos, offres, avis
- **SEO** — Meta tags + Open Graph dynamiques
- **3 langues** — Français, English, العربية
- **Responsive** — Mobile-first, animations CSS (stagger, fade, smooth scroll)
- **Page 404** personnalisée

## 📁 Architecture

```
├── app/
│   ├── __init__.py      # Flask app factory + blueprint registration
│   ├── auth.py          # JWT token_required decorator → g.user
│   ├── config.py        # Config (DB URL, JWT secret, Cloudinary)
│   ├── db.py            # db_query() / db_run() — ? placeholders (auto %s pour PG)
│   ├── utils.py         # Helpers (slugify, etc.)
│   ├── models/          # SQL init + seed data
│   └── routes/          # Blueprints (offers, bookings, reviews, chat, admin…)
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Router (pushState), page dispatcher
│   │   ├── api/         # api(path, opts) → JSON parsed, JWT auto-attached
│   │   ├── components/  # Navbar, Footer, OfferCard, ChatModal, ImageUpload…
│   │   ├── context/     # AuthContext, ToastContext
│   │   ├── hooks/       # useNotifications
│   │   ├── pages/       # HomePage, TripsPage, OfferPage, DashPage, AdminPage…
│   │   ├── styles/      # globals.css (variables, animations, responsive)
│   │   └── utils/       # translations, slug, wilayas, validation, styles
│   └── vite.config.js
├── server.py            # Entry point — build frontend + serve Flask
├── start.sh             # Production start script
└── requirements.txt
```

**Routing** : `history.pushState` dans `App.jsx`, Flask catch-all sert `index.html`

**URLs** : `/voyages`, `/offre/:slug`, `/agence/:slug`, `/connexion`, `/inscription`, `/mon-espace/:sub`, `/admin/:sub`

## 💻 Développement local

```bash
# Backend
pip install -r requirements.txt
python server.py
# → http://localhost:5000

# Frontend (dev avec HMR)
cd frontend
npm install
npm run dev
# → http://localhost:5173 (proxy vers Flask)
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@getlostdz.com | admin123 |
| Agence | agency1@getlostdz.com | agency123 |
| Voyageur | sarah@test.com | user123 |

## 🚀 Déploiement

### Render.com (actuel)
- Build : `pip install -r requirements.txt && cd frontend && npm install && npm run build`
- Start : `gunicorn server:app --bind 0.0.0.0:$PORT`
- Variables d'environnement : `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`

### Railway (alternative)
- Push vers GitHub → Railway auto-détecte Python → déploie automatiquement

## 📝 Roadmap

- [x] Landing page refonte (hero slider, stats, témoignages, CTA)
- [x] Partage social (WhatsApp, Facebook, copier lien)
- [x] Nettoyage repo (.gitignore, README)
- [ ] Paiement en ligne — CIB / Dahabia / BaridiMob

---

© Get Lost DZ — Tous droits réservés
