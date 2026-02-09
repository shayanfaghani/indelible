Project Specification: Indelible (PWA)
1. Vision & Goals
The Product: A high-end, minimalist spaced-repetition (Leitner) app focused on lifelong mastery rather than short-term testing.

The USP: The "Infinity Vault." Cards eventually reach a state of permanent maintenance where they are resurfaced every 1–2 years to ensure they are never forgotten.

Core Value: Consistency over intensity. If a user is overwhelmed, the app "smooths" the backlog to prevent burnout.

2. Technical Stack
Framework: Next.js 14+ (App Router).

Language: TypeScript (Strict mode).

Styling: Tailwind CSS (Mobile-first, Dark Mode primary).

Backend/Auth: Supabase (PostgreSQL + GoTrue Auth).

Animations: Framer Motion (For "vaulting" effects).

PWA: next-pwa for manifest and service worker configuration.

3. Database Schema (Supabase/Postgres)
profiles: id (uuid, primary key), user_id (fk), xp (int), knowledge_net_value (int).

cards:

id (uuid)

user_id (uuid, references auth.users)

front (text), back (text)

box_level (int, 1-8)

last_reviewed (timestamp)

next_review_at (timestamp)

is_vaulted (boolean) — Set to true when level >= 6.

Row Level Security (RLS): Policies must be enabled so:

SELECT: auth.uid() == user_id

INSERT/UPDATE: auth.uid() == user_id

4. The Leitner Logic (The Engine)
Box Intervals: Box 1 (1d), Box 2 (2d), Box 3 (4d), Box 4 (8d), Box 5 (16d), Box 6 (180d), Box 7 (365d), Box 8 (730d).

Success Logic: level = min(level + 1, 8).

Failure Logic: level = max(level - 2, 1). (Soft landing, not back to 0).

Smoothing Algorithm: If total due cards > 25, the app must:

Prioritize Box 1 (new/fragile).

Prioritize Box 6-8 (Vault maintenance).

Push the remaining "middle" cards by 24 hours.

5. Deployment & Environment Strategy
Environments:

QA: Branch develop -> Deployed on Vercel at qa.indelible.app. Connected to Supabase Project Indelible-QA.

PROD: Branch main -> Deployed on Vercel at indelible.app. Connected to Supabase Project Indelible-PROD.

Workflow: All new features are pushed to develop first. After manual testing in the QA environment, a Pull Request is made to main.

6. Required Connections & Initializations
Supabase Client: Initialize using @supabase/auth-helpers-nextjs.

Environment Variables:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

PWA Setup: Generate a manifest.json and icons (512x512). Set theme_color: #0A0A0B and display: standalone.

7. UI/UX Requirements
Theme: Obsidian (#0A0A0B), Gold (#E5C05E), Emerald (#10B981).

Components to generate:

Auth Guard: Redirect unauthenticated users to Login.

Dashboard: Shows "Knowledge Net Value" and "Daily Cards Remaining."

Review Engine: A card-flipping interface with a three-button footer (Forgot/Hard/Got it).

Vault Animation: A celebratory visual when a card hits Level 6.