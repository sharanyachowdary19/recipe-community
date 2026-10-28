# Recipe Finder

Recipe Finder is a beginner-friendly full-stack web application for discovering recipes from a PostgreSQL database. Users can search by recipe name or ingredient text, filter by category, limit the maximum total cooking time, and open a recipe to see its ingredients and method.

## 1. Project overview

### Problem statement

When people have a few ingredients available but do not know what to cook, searching through unrelated recipes can take time. Recipe Finder provides a small searchable recipe collection with useful filters and a clear recipe-detail view.

### Objectives

- Build a real full-stack application using HTML, CSS and Vanilla JavaScript.
- Learn how a browser communicates with an Express REST API.
- Store persistent recipe data in Supabase PostgreSQL.
- Practice request validation and server-side authorization.
- Demonstrate a responsive user interface suitable for a first-year B.Tech project.

### Target users and roles

- **Public user:** Can browse, search, filter and view recipes.
- **Administrator:** Can create, update and delete recipes through protected API endpoints.

There is intentionally no public registration/login system in this MVP. A recipe catalogue does not require personal accounts, so adding authentication would increase complexity without improving the core use case. Administrative writes are protected by a server-side API key.

## 2. Implemented features

- Recipe listing from Supabase PostgreSQL.
- Search by recipe name or description/ingredient-related text.
- Category filtering.
- Maximum total preparation + cooking time filtering.
- Recipe detail dialog.
- Empty, loading and error states.
- Responsive layout for desktop, tablet and mobile.
- Protected administrator create/update/delete API routes.
- Input validation on the server.
- Rate limiting and security headers.
- Database constraints, indexes, timestamps and RLS.
- Five demo recipes included in the SQL schema.

## 3. Technology stack

- Frontend: HTML5, CSS3, Vanilla JavaScript.
- Backend: Node.js + Express.js.
- Database: Supabase PostgreSQL.
- Version control: Git + GitHub.
- npm packages: `express`, `@supabase/supabase-js`, `dotenv`, `helmet`, `cors`, `express-rate-limit`.

No React, Angular, Vue, TypeScript, MongoDB, Firebase, Python or external recipe API is required.

## 4. Folder structure

```text
recipe-finder/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── recipes.js
│   │   └── categories.js
│   ├── middleware/
│   │   └── admin.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

`package-lock.json` is generated automatically by `npm install`, so it is not manually maintained in this project response.

## 5. Prerequisites

Install:

- Visual Studio Code: https://code.visualstudio.com/
- Node.js LTS: https://nodejs.org/
- Git: https://git-scm.com/
- A free Supabase account: https://supabase.com/

Check the installations in a new terminal:

```powershell
node --version
npm --version
git --version
```

A successful setup prints version numbers.

## 6. Supabase setup

1. Sign in to Supabase.
2. Create a new project.
3. Choose a project name such as `recipe-finder`.
4. Create a strong database password and keep it private.
5. Wait until the project is ready.
6. Open **SQL Editor**.
7. Create a new SQL query.
8. Copy all of `database/schema.sql` into the editor.
9. Run the SQL.
10. Open **Table Editor** and confirm that a `recipes` table exists with demo rows.

The backend needs the Supabase project URL and the server-only service-role key.

In the Supabase dashboard, open the project settings/API area and copy:

- Project URL -> `SUPABASE_URL`
- Service role key -> `SUPABASE_SERVICE_ROLE_KEY`

Never put the service-role key in frontend JavaScript.

## 7. Environment variables

Create this file locally:

```text
backend/.env
```

Use this template and replace the placeholder values:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key
ADMIN_API_KEY=your-long-random-admin-key
```

### What each variable means

- `PORT`: port used by Express.
- `NODE_ENV`: application environment.
- `SUPABASE_URL`: address of your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged server-side Supabase key. Keep it secret.
- `ADMIN_API_KEY`: secret required for administrator recipe-management requests.

`.env.example` contains names and fake placeholder values. `.env` contains your actual local secrets and is excluded from Git.

### Generate a random admin key

From the `backend` directory:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `ADMIN_API_KEY`.

## 8. Install dependencies

Open a terminal in the `backend` directory:

```powershell
npm install
```

This installs the packages listed in `backend/package.json` and creates `backend/package-lock.json`.

Optional syntax check:

```powershell
npm run check
```

## 9. Start the application

From `backend`:

```powershell
npm start
```

Expected output:

```text
Recipe Finder is running at http://localhost:3000
```

Open:

```text
http://localhost:3000
```

The Express server serves the files from `frontend/`.

For development with automatic server restart:

```powershell
npm run dev
```

## 10. Architecture

```text
Browser
  |
  | fetch()
  v
Express REST API
  |
  | Supabase server client
  v
Supabase PostgreSQL
```

The browser never connects directly using the service-role key.

### Main workflow

1. Browser loads `/`.
2. Express serves `frontend/index.html`, `styles.css` and `app.js`.
3. `app.js` requests `/api/categories`.
4. `app.js` requests `/api/recipes`.
5. Express validates the request and queries Supabase.
6. Supabase returns recipe records.
7. Express sends JSON to the browser.
8. Vanilla JavaScript safely renders the data with DOM APIs such as `textContent`.

## 11. API endpoints

### Health check

`GET /api/health`

Purpose: Confirm that the Express server is running.

Authentication: None.

Successful response:

```json
{
  "ok": true,
  "message": "Recipe Finder API is running."
}
```

### List/search recipes

`GET /api/recipes`

Optional query parameters:

- `search`: text to search in recipe name/description.
- `category`: category name.
- `maxTime`: maximum total preparation + cooking time in minutes.

Example:

```text
GET /api/recipes?search=tomato&maxTime=60
```

Authentication: None.

### Get one recipe

`GET /api/recipes/:id`

Authentication: None.

Returns the complete recipe.

### List categories

`GET /api/categories`

Authentication: None.

Returns categories currently represented in the recipe table.

### Create recipe

`POST /api/recipes`

Authentication: `x-admin-key` header matching `ADMIN_API_KEY`.

Request body:

```json
{
  "name": "Paneer Wrap",
  "description": "A quick paneer wrap.",
  "category": "Vegetarian",
  "ingredients": ["paneer", "roti", "onion"],
  "steps": ["Cook the filling.", "Fill the roti.", "Roll and serve."],
  "prep_time_minutes": 10,
  "cook_time_minutes": 10,
  "servings": 2,
  "emoji": "🌯"
}
```

### Update recipe

`PUT /api/recipes/:id`

Authentication: `x-admin-key`.

Request body: Same recipe fields as create.

### Delete recipe

`DELETE /api/recipes/:id`

Authentication: `x-admin-key`.

The public browser UI intentionally does not expose admin CRUD controls in this MVP. The endpoints are available for demonstration and can be connected to an admin page later.

## 12. Security

- The Supabase service-role key exists only in `backend/.env`.
- `.env` is ignored by Git.
- Server-side validation prevents malformed recipe data.
- Admin write endpoints require the `x-admin-key` header.
- Express uses Helmet security headers.
- Express rate-limits API requests.
- The frontend uses `textContent` instead of injecting user/database content as HTML.
- PostgreSQL constraints reject invalid categories, times and serving counts.
- RLS is enabled on `recipes`; direct anonymous access is denied.
- The backend is the trusted server that uses the service-role key.

Because this MVP uses a single admin API key rather than individual accounts, it is appropriate for a college demonstration but not a production multi-user administration system.

## 13. Sample usage

1. Open the home page.
2. Search for `tomato`.
3. Choose `Dinner`.
4. Set maximum time to `60`.
5. Click **Find recipes**.
6. Open a recipe with **View recipe**.
7. Click **Clear** to return to all recipes.

To test admin creation manually, use a REST client or browser developer tools with the `x-admin-key` header. Do not put the admin key into frontend source code.

## 14. Manual testing checklist

| Test | Action | Expected result |
|---|---|---|
| Server health | Open `/api/health` | JSON health response |
| Initial load | Open `/` | Recipe cards appear |
| Search | Search `tomato` | Matching recipes appear |
| Category | Select `Dinner` | Only dinner recipes appear |
| Time filter | Enter `30` | Recipes over 30 total minutes are removed |
| Combined filters | Use search + category + time | Results satisfy all selected filters |
| Empty result | Search an unlikely word | Empty state appears |
| Clear | Click Clear | All recipes return |
| Detail | Click View recipe | Dialog shows ingredients and method |
| Invalid max time | Enter `0` or `1801` | Friendly validation error from API |
| Admin missing key | POST without `x-admin-key` | HTTP 401 |
| Admin wrong key | POST with wrong key | HTTP 401 |
| Admin valid key | POST with correct key | HTTP 201 and saved recipe |
| Update | PUT valid recipe with correct key | HTTP 200 and updated recipe |
| Delete | DELETE valid recipe with correct key | HTTP 200 |
| Responsive | Resize browser to mobile width | Layout becomes single-column |
| Database failure | Temporarily use an invalid server key | API reports an error without exposing secrets |

## 15. Troubleshooting

### `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured`

Check that `backend/.env` exists and has both variables.

### `Invalid API key` or database errors

Check that the Supabase project URL is correct and that you copied the server-side service-role key from the correct project.

Restart the server after changing `.env`.

### `EADDRINUSE`

Another program is using port 3000. Either stop that program or change:

```env
PORT=3001
```

Then open `http://localhost:3001`.

### Page loads but no recipes appear

1. Open `/api/health`.
2. Open `/api/recipes`.
3. If the API reports a database error, verify the SQL schema was executed.
4. Verify that `recipes` contains the demo rows.
5. Check the terminal running Express for the server error.

### `npm` is not recognized

Reinstall Node.js LTS and restart VS Code/your terminal.

### Git accidentally includes `.env`

Stop before pushing. Confirm `.gitignore` contains `.env`.

If a real secret was already committed, simply adding it to `.gitignore` is not enough. Rotate the exposed credential immediately and remove the secret from Git history.

## 16. GitHub upload

From the root `recipe-finder` directory:

```powershell
git init
git status
git add .
git status
git commit -m "Build project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your own empty GitHub repository.

Before `git add .`, verify:

- `backend/.env` is not listed.
- `node_modules/` is not listed.
- `.env.example` is listed.
- No service-role key is inside source files.
- No private personal information is included.

### Create the GitHub repository

1. Sign in to GitHub.
2. Create a new repository named `recipe-finder`.
3. Do not upload secrets.
4. Copy the repository URL.
5. Run the commands above from the local root folder.
6. Refresh GitHub and verify the project files are present.

## 17. Limitations and future improvements

This MVP intentionally does not include:

- User registration/login.
- Personal favourite recipes.
- Ratings and reviews.
- Recipe images stored in an object-storage bucket.
- A graphical admin dashboard.
- Individual administrator accounts.

Possible future improvements:

- Add Supabase Auth for individual accounts.
- Add favourites associated with authenticated users.
- Add recipe image upload.
- Add an admin dashboard with create/edit/delete forms.
- Add more advanced ingredient matching.
- Add pagination for a very large recipe collection.

These are future improvements, not hidden requirements of the current MVP.

## 18. Verification

The project is designed so the frontend routes, Express endpoints, database columns and environment variable names match each other.

The provided `npm run check` performs JavaScript syntax checks. A real Supabase connection and browser interaction must still be tested by the student using their own Supabase project and credentials.
