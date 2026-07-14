# Amrita Ayurveda — React Edition

A full React conversion of the Amrita Ayurveda HTML site. Built with **Vite + React + React Router**, styled with **pure CSS** (no Tailwind, no TypeScript), and split into reusable components.

## Getting Started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `https://endearing-queijadas-0448a0.netlify.app`).

To build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  Component/        Reusable UI pieces (Header, Footer, HeroSlider, ProductCard, etc.)
  pages/             One file per route (HomePage, ShopPage, ProductPage, CartPage, ...)
  context/           CartContext (cart + wishlist) and AuthContext (demo login/session)
  data/              products.js — all product, category and content data
  styles/            Global.css + one CSS file per component
  styles/pages/      One CSS file per page
```

## Pages & Routes

| Route                  | Page                          |
|-------------------------|--------------------------------|
| `/`                     | Home                           |
| `/shop`                 | Shop (filter by category/price, sort, search) |
| `/product/:slug`        | Product detail                 |
| `/cart`                 | Cart                            |
| `/checkout`             | Checkout (Login → Address → Payment → Success) |
| `/ingredients`          | Shop by ingredient             |
| `/about`                | About / brand story            |
| `/contact`              | Contact form                   |
| `/login`, `/signup`     | Auth (demo, stored in localStorage) |
| `/forgot-password`, `/reset-password` | Password recovery flow |
| `/profile`              | Account dashboard, orders, wishlist, addresses |

## Notes

- Cart and wishlist state lives in `CartContext` and persists in `localStorage`.
- Login/signup is a front-end demo (no real backend) — it stores a fake session in `localStorage` via `AuthContext`.
- All product images are hotlinked from Unsplash, same as the original HTML build.
- Fully responsive: the header collapses into a slide-down mobile menu under 900px, and every grid/section reflows down to small phone widths.
