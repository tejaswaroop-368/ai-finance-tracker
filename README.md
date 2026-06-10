# Finance Management Dashboard

## Project overview
This is a finance management application built with React, TypeScript, and Vite. It allows users to manage accounts, track transactions, view a dashboard, and receive AI-driven financial insights.

The app includes:
- User authentication with login and signup views
- Protected routes for authenticated users
- Account and transaction management stored in `localStorage`
- A dashboard summary page
- A modern UI built with React Bootstrap and custom CSS
- An AI Insights page that summarizes transaction data and requests a financial analysis from Gemini

## How the project works
1. **Authentication**
   - Users sign up or log in using email and password fields.
   - The application stores user session data in `localStorage`.
   - Unauthenticated users are redirected to `/login`.

2. **Protected routes**
   - The app uses `react-router` and a `ProtectedRoute` wrapper.
   - Authenticated pages include dashboard, accounts, transactions, AI insights, and profile.

3. **Data storage**
   - Transaction and account data are saved in the browser's `localStorage`.
   - This keeps the app functional without a backend.

4. **AI Insights**
   - The `AI Insights` page reads transaction data from `localStorage`.
   - It calculates:
     - Total income
     - Total expenses
     - Net savings
     - Highest spending category
   - It sends the summary to Google Gemini using the `@google/generative-ai` library.
   - The response is displayed in reusable cards for:
     - Spending analysis
     - Overspending areas
     - Budget recommendations
     - Savings recommendations
     - Financial health score

## Available routes
The app supports the following routes:

- `/login` — login page
- `/sign-up` — signup page
- `/home` — dashboard overview
- `/home/accounts` — accounts management page
- `/home/transactions` — transaction list and editing page
- `/home/insights` — AI Insights page
- `/home/profile` — user profile page

## Project structure
Key files and folders:

- `src/App.tsx` — main route definitions and layout
- `src/main.tsx` — application bootstrap with `BrowserRouter`
- `src/components/SideBar.tsx` — navigation menu for authenticated pages
- `src/components/ProtectedRoute.tsx` — route guard for authenticated content
- `src/components/TransactionsListing.tsx` — transaction data table and editing logic
- `src/components/Insights.tsx` — AI Insights page and Gemini integration
- `src/components/AIInsightsCard.tsx` — reusable card component for AI results
- `src/components/style.css` — global styles and responsive layout
- `public/_redirects` — Netlify redirect rules for SPA routing

## AI integration details
The AI integration is implemented in `src/components/Insights.tsx`:
- Reads transaction data from `localStorage`
- Summarizes financial totals and categories
- Uses `@google/generative-ai` to call Gemini
- Renders the AI response in reusable cards

### Environment variable
The Gemini key is stored in:
- `.env`

Example:
```env
VITE_GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
```

## Running the project locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your Gemini API key.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app in the browser at the local Vite address.

## Deployment notes
- The project is set up for SPA deployment on Netlify.
- The `public/_redirects` file ensures client-side routes work after deploy.
- Example deployed route paths:
  - `https://ai-finance-management.netlify.app/home`
  - `https://ai-finance-management.netlify.app/login`
  - `https://ai-finance-management.netlify.app/home/insights`

## Screenshots to include for interview/demo
Add high-quality screenshots for the following views:

1. **Login page**
   - Show the initial authentication screen.
2. **Dashboard page**
   - Show summary cards or dashboard widgets.
3. **Accounts page**
   - Show account listing or account details.
4. **Transactions page**
   - Show transaction table and add/edit buttons.
5. **AI Insights page**
   - Show the `Generate AI Analysis` button, summary panel, and AI result cards.
6. **Profile page**
   - Show the user profile area and sidebar navigation.

## Why this project is resume-worthy
- Demonstrates full-stack React skills with TypeScript and Vite
- Implements client-side authentication and protected routing
- Uses browser storage and local persistence
- Integrates AI using Google Gemini
- Includes SPA-ready Netlify configuration for deployment
- Uses reusable React components and clean page layout

## Future improvements
Potential upgrades for production readiness:
- Add a backend API for secure authentication and persistent storage
- Move AI calls to a serverless function or backend proxy
- Add unit tests and integration tests
- Implement better error handling and loading states
- Add real account synchronization and external bank data support
