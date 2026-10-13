# SpendWise implementation plan

## Product approach
SpendWise is a polished, demo-ready personal expense tracker with a dark, editorial dashboard surface. The preview prioritizes the complete interaction model: landing page, auth flows, dashboard analytics, expense CRUD, category management, profile preferences, responsive navigation, and local persistence. API seams are kept in the frontend so the demo can be connected to the specified Spring Boot endpoints without changing the UI model.

## Design direction
- **Design movement:** dark fintech editorialism with glassmorphism restraint and subtle neo-brutalist data accents.
- **Core principles:** calm clarity, visible momentum, tactile depth, and useful density.
- **Color philosophy:** deep navy creates focus; emerald signals healthy control and progress; amber highlights decisions and spend attention; warm white keeps numeric content legible.
- **Layout paradigm:** a persistent rail and offset content canvas rather than a centered marketing grid; dashboard cards sit in an asymmetrical rhythm around the main chart.
- **Signature elements:** the emerald-orange gradient wordmark, thin-grid chart panels, and oversized “money in motion” hero orb.
- **Interaction philosophy:** every click should either reveal context, add a record, or reduce uncertainty. Hover states lift only the surface being inspected.
- **Animation:** short 180–420ms ease-out transitions, count-up values on entry, soft orb drift, and spring modals; no noisy perpetual motion in data areas.
- **Typography:** Inter for UI and data, with tight 700-weight headlines and generous numeric tracking.
- **Brand essence:** a calm command center for people who want to make better spending decisions without becoming accountants. Personality: **clear, optimistic, quietly sharp**.
- **Brand voice:** direct, encouraging, and specific. Example lines: “Your money has a pattern.” and “Make the next rupee intentional.”
- **Wordmark & logo:** a two-stroke “S” made from an emerald route line crossing an amber dot, paired with the SpendWise name.
- **Signature brand color:** SpendWise Emerald `#43E6A0`.

## Project structure
- `frontend/`: independent Vite deployment root containing `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `public/manus-routes.json`, `package.json`, `vite.config.js`, and `vercel.json`.
- `backend/`: independent Spring Boot deployment root containing `pom.xml`, `Dockerfile`, `application.properties`, the application entry point, CORS/security configuration, and API controllers for auth, expenses, categories, dashboard, and actuator health.
- Root docs/config: README, TODO, deployment notes, convenience scripts, and app metadata.

## Delivery workflow
1. Build the single-file React experience with realistic demo data and localStorage-backed session/theme state.
2. Install dependencies and run Vite on the configured port `3000` bound to `0.0.0.0`.
3. Verify route manifest, HTTP readiness, production build, and key page behavior through source inspection and preview screenshots when useful.
4. Save a canonical checkpoint after the preview is healthy.
