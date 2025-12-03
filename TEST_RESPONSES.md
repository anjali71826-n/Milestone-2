# Test Responses and API Outputs

This document captures the responses from the implemented tests and API endpoints.

## 1. API Endpoints

### Weekly Scheduler (`/api/cron/weekly-pulse`)
**Method:** GET
**Authorization:** Bearer <CRON_SECRET>
**Response:**
```json
{
  "message": "Weekly pulse generated and sent",
  "pulse": {
    "title": "Weekly Product Pulse: KYC Friction, Payment Issues, and Withdrawal Speed",
    "overview": "This pulse highlights persistent user friction across KYC, Payments, and Withdrawals...",
    "top_themes": [
      "KYC (Verification Failures & Support)",
      "Payments (UPI Issues & Transaction Failures)",
      "Withdrawals (Speed & Reliability)"
    ],
    "user_quotes": [
      "My federal account got blocked in kyc...",
      "Transfer failed today...",
      "I recharged my mobile using your app..."
    ],
    "action_ideas": [
      "Conduct a deep dive into KYC failure root causes...",
      "Investigate all failed UPI...",
      "Benchmark withdrawal settlement times..."
    ],
    "html_report": "<!DOCTYPE html>...",
    "markdown_report": "# Weekly Product Pulse..."
  }
}
```

### Manual Analysis (`/api/analyze`)
**Method:** POST
**Response:**
```json
{
  "message": "Analysis complete",
  "pulse": {
    "title": "Weekly Product Pulse: KYC Friction, Payment Issues, and Withdrawal Speed",
    "overview": "This pulse highlights persistent user friction across KYC, Payments, and Withdrawals...",
    "top_themes": [
      "KYC (Verification Failures & Support)",
      "Payments (UPI Issues & Transaction Failures)",
      "Withdrawals (Speed & Reliability)"
    ],
    "user_quotes": [
      "My federal account got blocked in kyc...",
      "Transfer failed today...",
      "I recharged my mobile using your app..."
    ],
    "action_ideas": [
      "Conduct a deep dive into KYC failure root causes...",
      "Investigate all failed UPI...",
      "Benchmark withdrawal settlement times..."
    ],
    "html_report": "<!DOCTYPE html>...",
    "markdown_report": "# Weekly Product Pulse..."
  },
  "reviewsCount": 250,
  "groupedReviewsCount": 250
}
```

## 2. Unit Test Scenarios

### Email Utility (`src/lib/email.test.ts`)
- **Scenario:** `sendEmail` with `html_report`.
- **Expected Outcome:** Calls `resend.emails.send` with provided HTML.
- **Verified:** PASS

- **Scenario:** `sendEmail` without `html_report`.
- **Expected Outcome:** Generates HTML from `pulse` object and calls `resend`.
- **Verified:** PASS

### LLM Utility (`src/lib/llm.test.ts`)
- **Scenario:** `groupReviews`.
- **Expected Outcome:** Returns array of reviews with `chosen_theme`.
- **Verified:** PASS

- **Scenario:** `generateWeeklyPulse`.
- **Expected Outcome:** Returns `pulse` object with title, overview, themes, quotes, actions, and reports.
- **Verified:** PASS

### Scraper Utility (`src/lib/scraper.test.ts`)
- **Scenario:** `fetchReviews`.
- **Expected Outcome:** Returns array of `Review` objects, filtered by date (last 12 weeks) and sorted by date.
- **Verified:** PASS
