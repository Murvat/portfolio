# Portfolio

One React and Tailwind CSS app with About me, Education, Certificates, Experience, Projects, Articles, Passion, and Library. Reading Room lives inside Library and uses Redux Toolkit for its reading list.

## Local development

Use Node.js 22 and npm. From the repository root:

```sh
npm ci
npm run dev
npm test
npm run build
```

Open http://localhost:5173. After stopping the dev server, run `npm run preview` to preview the production build on the same port.

## Content

Edit `src/content.js` to fill in your profile and add entries.

- Education, experience, certificates, and articles use `title`, `organization` (institution, employer, issuer, or publication), `dates`, and optional `description` and `url`.
- Projects use `title`, `description`, `contribution`, and an optional `url`. Reading Room links to its section on the same page.
- Library books use a unique string `id`, `title`, `author`, and optional `category` and `note`. The Library displays a labeled sample catalog until you add books. The saved list lasts for the current page session.

## API and deployment

Deploy the root `dist` directory to a single HTTPS host. Every section uses a fragment link on the homepage.

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` when the future API is available. Reading Room requests `GET <base-url>/books` and expects a JSON array using the same book fields as the local catalog. If the API is hosted on a different origin, configure it to allow the portfolio origin. Vite variables are public build-time settings.
