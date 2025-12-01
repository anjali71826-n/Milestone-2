**Milestone 2: App Review Insights Analyzer (IND Money Edition)**
=================================================================

In this milestone, you'll build an App Review Insights Analyzer that turns 8-12 weeks of App Store + Play Store reviews for **IND Money** into a weekly one-page pulse. Your system should import reviews, group them into up to 5 themes, highlight top insights, user quotes, and action ideas, and finally generate a draft email containing the note. This milestone tests your skills in LLMs, summarization, theme grouping, and workflow automation while staying within public data and avoiding any PII.

**Milestone Brief**
-------------------

**Product:** IND Money (Super Money App)

Turn recent App Store + Play Store reviews into a **one-page weekly pulse** containing:

*   Top themes (e.g., US Stocks, KYC issues, Portfolio Tracking)
    
*   Real user quotes
    
*   Three action ideas
    

Finally, send yourself a **draft email** containing this weekly note.

### **Who This Helps**

*   **Product / Growth Teams** → Understand friction in user journeys (e.g., why users drop off during US Stock onboarding).
    
*   **Support Teams** → Know what users are complaining about (e.g., "Money stuck in transit").
    
*   **Leadership** → Quick weekly health pulse on trust and app stability.
    

### **What You Must Build**

1.  **Import reviews** from the last 8-12 weeks (rating, title, text, date).
    
2.  **Group reviews** into 5 themes max (e.g., US Stocks, KYC/Onboarding, Payments/Withdrawals, Portfolio Tracking, Customer Support).
    
3.  **Generate a weekly one-page note**:
    

*   Top 3 themes
    
*   3 user quotes
    
*   3 action ideas
    

1.  **Draft an email** with the note (send to yourself/alias).
    
2.  **Do NOT include PII** (Personally Identifiable Information).
    

### **Key Constraints**

*   **Public review exports only**; no scraping behind logins.
    
*   **Max 5 themes**.
    
*   **Keep notes scannable**, $\\le250$ words.
    
*   **No usernames/emails/IDs** in any artifacts.
    

**Deliverables**
----------------

1.  **Working prototype link** or ≤3-min demo video.
    
2.  **Latest one-page weekly note** (PDF/Doc/MD).
    
3.  **Email draft** (screenshot or text).
    
4.  **Reviews CSV used** (sample/redacted is fine).
    
5.  **README**:
    

*   How to re-run for a new week.
    
*   Theme legend.
    

### **Skills Being Tested**

*   **W2 LLMs & Prompting:** Summarization, Quote selection, Tone control.
    
*   **W3 AI Workflow Automations:** Import → Group → Generate Note → Draft Email.
    

**Example: IND Money Context**
------------------------------

Turn recent IND Money reviews into a one-page weekly pulse: top themes, real user quotes, and three action ideas—then send yourself a draft email of the note.

**Reviews Sources:**

*   Google Play Store: in.indwealth
    
*   Apple App Store: indmoney-stocks-mutual-funds
    

**Example Themes for IND Money:**

1.  **US Stocks Investing** (Remittance charges, buying process)
    
2.  **KYC & Onboarding** (Document verification, rejection reasons)
    
3.  **Deposits & Withdrawals** (Money stuck, SBM bank issues)
    
4.  **Portfolio Tracking** (Syncing issues with CAS/Gmail)
    
5.  **Customer Support** (Response time, ticket resolution)
    

**Architecture**
----------------

Here is a detailed architecture for an AI workflow that turns public IND Money reviews into a weekly scannable product pulse, leveraging LLMs for summarization, quote selection, and tone control, along with automation for data import, grouping, note generation, and email drafting.

### **Architecture Overview**

This system comprises four automated workflow layers:

**Layer**

**Functionality**

**Example Technology**

**1\. Data Import**

Fetch public IND Money reviews (last 8-12 weeks)

Python google-play-scraper, app-store-scraper

**2\. Data Grouping**

Cluster reviews into max 5 key themes using prompt-driven LLM grouping

LLM (via LangChain), Clustering

**3\. Summarization & Note Gen**

Create weekly one-page pulse: 3 themes, 3 quotes, 3 action ideas (≤250 words)

LLM map-reduce, custom prompts

**4\. Email Drafting**

Generate and send a draft email with the note, stripping all PII

LLM tone prompt, SMTP/Google API

### **Layer Breakdown**

**Layer 1: Data Import & Validation**

*   Scraper/API Client (public Play Store/App Store data).
    
*   Schema Validator (ensure title, text, date exist).
    
*   PII Detector (early filtering of phone numbers/emails often found in financial app reviews).
    
*   Deduplication.
    

**Layer 2: Theme Extraction & Classification**

*   Theme Clustering (Assign reviews to "US Stocks", "KYC", etc.).
    
*   Theme Labeling (LLM generates human-readable names).
    
*   Theme Limit Enforcer (Strictly max 5).
    

**Layer 3: Content Generation**

*   Quote Extraction (per theme, with source references).
    
*   Theme Summarization (per theme).
    
*   Action Idea Generator (chain-of-thought prompting: "Given these withdrawal complaints, what should Product do?").
    
*   Pulse Document Assembler.
    

**Layer 4: Distribution & Feedback**

*   Email Template Renderer.
    
*   PII Final Check (Critical for Fintech data).
    
*   Delivery System.
    

**Step-by-Step Workflow**
-------------------------

### **STEP 1: Import Reviews (Last 8-12 Weeks)**

**Goal:** Pull public IND Money reviews (title, text, date) and store them as structured data, without logins or PII.

**1.1 Trigger and Scheduling**

*   A scheduler (GitHub Actions / Cron / Zapier) runs once a week (e.g., Monday 9 AM IST).
    

**1.2 Data Source and Extraction**

*   **Input:** Google Play ID (in.indwealth) or App Store ID.
    
*   **Library:** Use google-play-scraper (Python) or app-store-scraper.
    
*   **Extract:**
    
*   Title (Review heading)
    
*   Body text
    
*   Date
    
*   Rating (Optional, but useful for filtering)
    

**1.3 Time Filtering and Cleaning**

*   Filter reviews where date is in \[today-84d, today-7d\].
    
*   **Text Cleaning:**
    
*   Strip HTML tags, emojis.
    
*   **Crucial:** Remove Account Numbers, PAN, or Phone Numbers using Regex (IND Money users often post these in frustration).
    

**1.4 Storage Model**

*   Store weekly buckets: week\_start\_date, review\_id, text, date.
    

### **STEP 2: Group Into Max 5 Themes**

**Goal:** Assign each review to one of at most 5 themes relevant to IND Money.

2.1 Theme Definition

Maintain a configuration object with allowed themes:

1.  **US Stocks** (Buying/Selling, Remittance, FX rates)
    
2.  **Onboarding & KYC** (Video KYC, Document upload)
    
3.  **Deposits & Withdrawals** (UPI failures, "Money cut but not credited")
    
4.  **Portfolio Tracking** (External portfolio sync, accuracy)
    
5.  **App Experience** (Bugs, Crashes, UI)
    

2.2 LLM-Based Classification Prompt

Batch reviews by week. For each review, call the LLM:

"You are tagging fintech app reviews for IND Money into at most 5 fixed themes.

Allowed themes:

1.  US Stocks
    
2.  Onboarding & KYC
    
3.  Deposits & Withdrawals
    
4.  Portfolio Tracking
    
5.  App Experience
    

For each review, output:

*   review\_id
    
*   chosen\_theme (exactly one from list)
    
*   short\_reason"
    

**2.3 Theme Count Aggregation**

*   Compute counts per theme for the week.
    
*   Sort themes by count to identify the "Top 3".
    

### **STEP 3: Generate Weekly One-Page Note**

**Goal:** Create a ≤250-word, bullet-heavy note with 3 themes, 3 quotes, and 3 action ideas.

**3.1 Weekly Review Subset**

*   Pull reviews for the **Top 3** themes identified in Step 2.
    

**3.2 Intermediate "Topic Summaries" (Map Stage)**

*   Chunk reviews per theme. Prompt per chunk:"Summarize user feedback for IND Money regarding {{theme\_name}}. Extract 3 key pain points and 3 candidate quotes. Remove all PII (names, account numbers)."
    

**3.3 Global Weekly Synthesis (Reduce Stage)**

*   Collate summaries into a single LLM call:"You are creating a weekly product pulse for IND Money leadership.Input: Summaries for Top 3 themes (e.g., US Stocks, KYC, Withdrawals).Tasks:
    

1.  Create a short title.
    
2.  Write a 60-word overview.
    
3.  Bullet points for Top 3 themes.
    
4.  Select 3 vivid user quotes (Anonymized).
    
5.  Suggest 3 specific action ideas (e.g., 'Improve error messaging during SBM bank linkage').
    

**Constraint:** Total length ≤ 250 words. Professional, objective tone."

**3.4 Word-Limit Enforcement**

*   If output > 250 words, run a "Compress" prompt.
    

### **STEP 4: Draft and Send Weekly Email**

**Goal:** Automatically generate and send an email tailored to Product/Support/Leadership.

**4.1 Email Content Drafting**

*   **Prompt:**
    

"Draft an internal email sharing the IND Money Weekly Pulse.Audience: Product Managers & Leadership.Content: {{weekly\_pulse\_json}}Structure:

*   Intro (time window)
    
*   The Pulse Note (Themes, Quotes, Actions)
    
*   ClosingStrictly NO PII."
    

**4.2 Subject Line Generation**

*   "Weekly Pulse: IND Money ({{week\_start}} - {{week\_end}})"
    

**4.3 Email Sending Automation**

*   Use SMTP (Gmail) or an email API.
    
*   Log the send status.
    

**4.4 Safety & Privacy Checks**

*   Final Regex scrub for email addresses or 10-digit phone numbers before sending.
    

### **STEP 5: Deployment & Integration**

**GitHub Actions Workflow**

1.  **Push to GitHub:** Store your code in a repository.
    
2.  **Add Secrets:**
    

*   GEMINI\_API\_KEY: For LLM processing.
    
*   EMAIL\_SENDER: Your Gmail address.
    
*   EMAIL\_PASSWORD: Your Google App Password (from myaccount.google.com/apppasswords).
    

1.  **Create Workflow File:** .github/workflows/weekly\_pulse.yml that runs your Python script.
    
2.  **Test It:** Run the workflow manually and check your inbox for the "IND Money Weekly Pulse".
    

**HINTS**
---------

1.  **Step 1:** Use the google-play-scraper Python library. It's the easiest way to get reviews without authentication.from google\_play\_scraper import Sort, reviewsresult, \_ = reviews(    'in.indwealth',    lang='en',    country='in',    sort=Sort.NEWEST,    count=200)
    
2.  **Step 2:** If you have too many reviews, you can force the clustering/grouping to happen in larger batches to save API calls.