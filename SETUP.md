# Indelible - Setup Guide

This guide will help you set up both QA and Production environments for Indelible.

## Supabase Setup

### 1. Create Projects

Create two Supabase projects:
- **Indelible-QA** (for development/testing)
- **Indelible-PROD** (for production)

### 2. Run Database Migration

For **both** projects:

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and execute the SQL

This will create:
- `profiles` table with XP and Knowledge Net Value
- `cards` table with Leitner box system fields
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 3. Get API Credentials

For each project, get:
- Project URL (Settings → API → Project URL)
- Anon/Public Key (Settings → API → Project API keys → anon public)

## Environment Configuration

### Local Development

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-qa-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-qa-anon-key
```

### Vercel Deployment

#### QA Environment

1. Connect `develop` branch to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: QA project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: QA anon key
3. Set custom domain: `qa.indelible.app`

#### Production Environment

1. Connect `main` branch to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: PROD project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: PROD anon key
3. Set custom domain: `indelible.app`

## Workflow

1. Develop features on feature branches
2. Merge to `develop` → Auto-deploy to QA
3. Test in QA environment
4. Create PR from `develop` to `main`
5. Merge to `main` → Auto-deploy to Production

## Testing the App

1. Sign up for a new account
2. Create a few test cards
3. Review cards and test the three buttons (Forgot/Hard/Got it)
4. Review a card successfully multiple times to see it progress through boxes
5. Get a card to Level 6 to see the vault animation

## Troubleshooting

### Authentication Issues

- Verify Supabase URL and anon key are correct
- Check that RLS policies are enabled
- Ensure the profile creation trigger is active

### Cards Not Appearing

- Check that cards table exists
- Verify RLS policies allow SELECT for authenticated users
- Check browser console for errors

### PWA Not Installing

- Ensure you're using HTTPS (required for PWA)
- Check that manifest.json is accessible
- Verify service worker is registered (only in production build)
