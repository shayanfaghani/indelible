# Indelible - Lifelong Knowledge Mastery

A high-end, minimalist spaced-repetition PWA built with Next.js 14, TypeScript, and Supabase. Features the "Infinity Vault" system for permanent knowledge retention.

## 🌟 Features

- **8-Level Leitner System**: Progressive spaced repetition from daily to 2-year intervals
- **Infinity Vault**: Cards reaching Level 6+ enter permanent maintenance mode
- **Smart Smoothing**: Prevents burnout by intelligently managing daily card load
- **Knowledge Net Value**: Track your cumulative learning progress
- **PWA Support**: Install on any device for offline access
- **Dark Mode First**: Premium obsidian and gold aesthetic

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Two Supabase projects (QA and PROD)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create two Supabase projects: `Indelible-QA` and `Indelible-PROD`
2. Run the migration script in each project's SQL Editor:
   ```bash
   # Copy contents of supabase/migrations/001_initial_schema.sql
   # Paste into Supabase SQL Editor and execute
   ```

### 3. Configure Environment Variables

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### QA Environment

- **Branch**: `develop`
- **URL**: `qa.indelible.app`
- **Supabase**: Indelible-QA project

### Production Environment

- **Branch**: `main`
- **URL**: `indelible.app`
- **Supabase**: Indelible-PROD project

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables for each environment
3. Set up custom domains
4. Deploy!

## 🎯 The Leitner System

Cards progress through 8 boxes with increasing intervals:

1. **Box 1**: Daily (new/fragile)
2. **Box 2**: 2 days
3. **Box 3**: 4 days
4. **Box 4**: 8 days
5. **Box 5**: 16 days
6. **Box 6**: 6 months (VAULT)
7. **Box 7**: 1 year (VAULT)
8. **Box 8**: 2 years (VAULT)

### Review Logic

- **Success**: Move up 1 level (max 8)
- **Hard**: Stay at current level
- **Forgot**: Drop 2 levels (min 1)

### Smoothing Algorithm

When daily cards exceed 25:
1. Prioritize Box 1 (fragile cards)
2. Prioritize Box 6-8 (vault maintenance)
3. Push Box 2-5 cards by 24 hours

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Animations**: Framer Motion
- **PWA**: next-pwa

## 📱 PWA Installation

The app can be installed on any device:

1. Visit the app in your browser
2. Look for "Add to Home Screen" or "Install" prompt
3. Enjoy offline access and native app experience

## 🎨 Design System

- **Obsidian**: `#0A0A0B` (Background)
- **Gold**: `#E5C05E` (Primary accent)
- **Emerald**: `#10B981` (Success/Vault)

## 📄 License

MIT
