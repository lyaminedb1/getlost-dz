# 🏔️ Get Lost DZ — Full-Stack Travel Platform

**Stack:** Python 3 + Flask + SQLite (backend) · React 18 (frontend)  
**Zero config** — one command to run, works offline.

---

## 🚀 Quick Start

```bash
# Install Python dependencies once
pip install flask flask-cors pyjwt bcrypt

# Run
python3 server.py
# → http://localhost:5000
```

Or just use the helper script:
```bash
chmod +x start.sh && ./start.sh
```

---

## 👤 Demo Accounts

| Role     | Email                     | Password   |
|----------|---------------------------|------------|
| Admin    | admin@getlostdz.com       | admin123   |
| Agency 1 | agency1@getlostdz.com     | agency123  |
| Agency 2 | agency2@getlostdz.com     | agency123  |
| Traveler | sarah@test.com            | user123    |

---

## 📁 Project Structure

```
getlost-dz/
├── server.py          # Flask API — all routes, JWT auth, SQLite
├── getlost.db         # SQLite database (auto-created on first run)
├── static/
│   └── index.html     # React single-page app (all-in-one)
├── start.sh           # Helper launch script
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /api/auth/login       | Login → JWT token        |
| POST   | /api/auth/register    | Register new user        |
| GET    | /api/auth/me          | Get current user profile |

### Offers
| Method | Endpoint                    | Auth       | Description          |
|--------|-----------------------------|------------|----------------------|
| GET    | /api/offers                 | Public     | List (filter/search) |
| GET    | /api/offers/:id             | Public     | Detail + view count  |
| POST   | /api/offers                 | Agency     | Create offer         |
| PUT    | /api/offers/:id             | Agency     | Update offer         |
| DELETE | /api/offers/:id             | Agency     | Delete offer         |
| PATCH  | /api/offers/:id/status      | Admin      | Approve / reject     |

### Reviews
| Method | Endpoint                         | Auth       | Description         |
|--------|----------------------------------|------------|---------------------|
| GET    | /api/offers/:id/reviews          | Public     | Approved reviews    |
| POST   | /api/offers/:id/reviews          | Traveler   | Submit review       |
| PATCH  | /api/reviews/:id/status          | Admin      | Approve / reject    |

### Agencies
| Method | Endpoint                    | Auth       | Description          |
|--------|-----------------------------|------------|----------------------|
| GET    | /api/agencies               | Public     | All agencies + stats |
| PUT    | /api/agencies/:id           | Agency     | Update profile       |
| PATCH  | /api/agencies/:id/status    | Admin      | Approve / suspend    |
| GET    | /api/agencies/:id/offers    | Agency     | Agency's own offers  |

### Bookings
| Method | Endpoint            | Auth       | Description          |
|--------|---------------------|------------|----------------------|
| POST   | /api/bookings       | Auth       | Book an offer        |
| GET    | /api/bookings/my    | Auth       | My bookings history  |

### Admin
| Method | Endpoint            | Auth  | Description         |
|--------|---------------------|-------|---------------------|
| GET    | /api/admin/stats    | Admin | Platform statistics |
| GET    | /api/admin/offers   | Admin | All offers          |
| GET    | /api/admin/reviews  | Admin | All reviews         |
| GET    | /api/admin/users    | Admin | All users           |

---

## ✅ Features Implemented (Cahier des Charges)

- [x] 3 roles: Traveler · Agency · Admin
- [x] JWT authentication (7-day tokens, bcrypt passwords)
- [x] Offer validation workflow: pending → approved / rejected
- [x] Star rating reviews with admin moderation
- [x] 4 categories: International, Algeria, Hiking, Visas
- [x] Search, filter, sort (rating / price ↑↓)
- [x] Booking system with history
- [x] Agency dashboard — full CRUD on offers
- [x] Admin panel — offers, agencies, reviews, users
- [x] Multilingual: 🇫🇷 French · 🇬🇧 English · 🇩🇿 Arabic (RTL)
- [x] Responsive design, brand-faithful teal/navy palette
- [x] 8 seeded offers, 5 reviews, 3 agencies

## 🔮 Next Steps (roadmap)
- [ ] Online payment (Stripe / CIB Algeria)
- [ ] Agency ↔ traveler messaging
- [ ] iOS / Android app
- [ ] Email notifications
