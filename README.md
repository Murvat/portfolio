# Portfolio

One React and Tailwind CSS app with About me, Education, Certificates, Experience, Projects, Articles, Passion, and Library. Reading Room lives inside Library and uses Redux Toolkit for its reading list.

## Run locally

Use Node.js 22, npm, and the .NET 10 SDK. From the repository root:

```sh
npm ci
dotnet user-secrets set --project server "Portfolio:AdminPassword" "<your-unique-random-password>"
dotnet run --project server --no-launch-profile -- --environment Development --urls http://localhost:5090
```

Set a password of at least 16 characters. Use your own secret and keep it out of source control and frontend environment variables. In a second terminal run `npm run dev` and open http://localhost:5173. Vite proxies the API to the local .NET server. A frontend-only run still shows the portfolio and sample library.

## Edit the portfolio

Choose **Admin sign in** in the footer. Each section gains inline controls to edit text and add or edit entries. Choose **Publish** to save an entry and make it visible to visitors on their next page load. Choose **Sign out of editor** in the footer when done. The single configured admin password is checked by ASP.NET Core and gives access to the Admin role for four hours.

`src/content.js` supplies the starting content. After the first publish the server uses its saved snapshot. If no book catalog has been published, the Library uses the starter books or a labeled sample catalog. An optional `VITE_API_BASE_URL` can supply an imported read-only catalog through `GET <base-url>/books` until you publish books through the editor.

## Build and host

```sh
npm test
npm run build
dotnet publish server -c Release
```

The published ASP.NET Core app serves both the frontend and API from the same origin. Host it on a .NET 10 server such as Azure App Service with HTTPS enforced at ingress. Configure these server-side settings:

| Setting | Purpose |
| --- | --- |
| `Portfolio__AdminPassword` | Unique admin password stored in the hosting service's secret settings or Key Vault |
| `Portfolio__DataPath` | Absolute path to a private, persistent directory for the published content and cookie-protection keys |

Use one server instance with this file-backed store, and back up its data directory. Ensure that only the app process and trusted administrators can access it. Deploying just the static frontend provides the read-only portfolio.
