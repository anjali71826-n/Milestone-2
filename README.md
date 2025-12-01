# App Review Insights Analyzer (IND Money)

This project automates the analysis of App Store and Play Store reviews for the IND Money app. It fetches reviews, groups them into themes using Gemini AI, generates a weekly pulse, and emails it.

## Setup

1.  **Install dependencies:**
    ```bash
    yarn install
    ```

2.  **Environment Variables:**
    Create a `.env.local` file with the following:
    ```
    GEMINI_API_KEY=your_gemini_api_key
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

3.  **Run Locally:**
    ```bash
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) and click "Run Analysis".

## Artifacts

### 1. Weekly One-Page Note (Sample)

**Title:** IND Money Weekly Pulse: US Stocks & KYC Friction (Nov 24 - Dec 01)

**Overview:**
User sentiment is mixed this week. While the new dashboard update is praised, significant friction remains in US Stock remittances and Video KYC rejections. Users are reporting money deducted but not reflected in wallets.

**Top 3 Themes:**
*   **US Stocks:** High remittance charges and delayed buy orders.
*   **Onboarding & KYC:** Video KYC failing repeatedly on Android 14.
*   **Deposits & Withdrawals:** UPI transactions stuck in "Processing" state.

**User Quotes:**
*   *"Money cut from bank but not showing in IND Money wallet for 3 days. Support is useless."*
*   *"Why are US stock charges so high compared to others? Hidden fees everywhere."*
*   *"KYC rejected 5 times saying 'image unclear' when my camera is 4K."*

**Action Ideas:**
*   **Audit US Stock Fees:** Review and transparently display all remittance charges upfront.
*   **Fix Android 14 KYC:** Investigate camera permission issues on the latest Android OS.
*   **Auto-Reversal UI:** Show a clear "Refund in progress" status for failed UPI adds to reduce panic.

### 2. Email Draft (Text)

**Subject:** Weekly Pulse: IND Money (Nov 24 - Dec 01)

**Body:**
Hi Team,

Here is the weekly pulse for IND Money based on recent app reviews.

**Overview**
User sentiment is mixed this week. While the new dashboard update is praised, significant friction remains in US Stock remittances and Video KYC rejections. Users are reporting money deducted but not reflected in wallets.

**Top Themes**
*   US Stocks
*   Onboarding & KYC
*   Deposits & Withdrawals

**User Quotes**
*   "Money cut from bank but not showing in IND Money wallet for 3 days. Support is useless."
*   "Why are US stock charges so high compared to others? Hidden fees everywhere."
*   "KYC rejected 5 times saying 'image unclear' when my camera is 4K."

**Action Ideas**
*   Audit US Stock Fees
*   Fix Android 14 KYC
*   Auto-Reversal UI

Regards,
AI Analyzer

### 3. Reviews CSV (Sample)

| id | date | score | title | text | source |
|---|---|---|---|---|---|
| gp_123 | 2023-11-28 | 1 | Money stuck | Added 5k via UPI, bank debited but app shows 0. | google_play |
| as_456 | 2023-11-29 | 5 | Great app | Best app for US stocks investing. | app_store |
| gp_789 | 2023-11-30 | 2 | KYC Issue | Video KYC keeps crashing on my Pixel. | google_play |

## Architecture

*   **Frontend:** Next.js (React)
*   **Backend:** Next.js API Routes
*   **Scraper:** `google-play-scraper`, `app-store-scraper`
*   **AI:** Google Gemini Pro (`@google/generative-ai`)
*   **Email:** `nodemailer`

## How to Re-run for a New Week

To generate the weekly insights for a new week:

1.  Ensure your local development server is running:
    ```bash
    yarn dev
    ```
2.  Navigate to the application in your browser (usually `http://localhost:3000`).
3.  Click the "Analyze Reviews" button.
4.  Wait for the analysis to complete.
5.  The new artifacts will be generated in the `public/output` directory:
    -   `reviews.csv`: Contains the latest 250 reviews used for analysis.
    -   `weekly_note.md`: The weekly insight note in Markdown format.

## Theme Legend

The AI groups reviews into one of the following 5 fixed themes:

1.  **Onboarding**: Issues or feedback related to the sign-up process, account creation, and initial setup.
2.  **KYC**: Feedback regarding Know Your Customer verification, document uploads, and approval times.
3.  **Payments**: Issues with deposits, UPI transactions, bank linking, and payment failures.
4.  **Statements**: Feedback about account statements, portfolio reports, and tax documents.
5.  **Withdrawals**: Issues related to redeeming funds, withdrawal delays, and settlement times.

Any review that does not fit into these categories is labeled as **Other**.
