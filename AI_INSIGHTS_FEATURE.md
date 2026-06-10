# AI Insights Feature

## Overview
This project now includes a new `AI Insights` page that reads transaction data from `localStorage`, summarizes the user's finances, and sends the summary to the Gemini API to receive financial advice.

## Where to see the changes
- `src/components/Insights.tsx`
  - Main implementation of the AI Insights page
  - Reads transactions from `localStorage`
  - Calculates total income, total expenses, net savings, and highest spending category
  - Sends summarized data to Gemini
  - Displays the AI response in a card layout

- `src/components/AIInsightsCard.tsx`
  - Reusable card component for displaying each AI advice section
  - Keeps the UI clean and modular

- `src/components/SideBar.tsx`
  - Updated the sidebar label from `Insights` to `AI Insights`

- `src/components/style.css`
  - Added styling for the AI Insights page
  - Includes summary cards, result cards, error messages, and responsive layout

## New feature details
### AI Insights workflow
1. The user navigates to `AI Insights` via the sidebar.
2. The page reads transaction records from `localStorage` under the `transactions` key.
3. It calculates:
   - Total income
   - Total expenses
   - Net savings
   - Highest spending category
4. When the user clicks `Generate AI Analysis`, the page sends only this summarized data to the Gemini API.
5. Gemini returns a structured response containing:
   - Spending analysis
   - Overspending areas
   - Budget recommendations
   - Savings recommendations
   - Financial health score out of 100
6. The page shows the results inside reusable AI card components.

## Environment setup
To use the Gemini integration, define the API key in a Vite env file or environment variable:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Then run the app with:

```bash
npm run dev
```

## Notes
- No existing functionality was removed or modified beyond adding this new page.
- The current implementation keeps the feature simple and focused.
- If you want, this doc can also be added to `README.md` or linked from the project home page.
