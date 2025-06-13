# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

```bash
# Start Convex backend (required for database)
npx convex dev

# Start Expo development server
npm run dev

# Platform-specific commands
npm run ios     # Run on iOS
npm run android # Run on Android
npm run web     # Run on web

# Linting
npm run lint
```

### Testing & Development Flow

1. Always run `npx convex dev` first to ensure database connectivity
2. Use `npm run dev` for development with hot reload
3. No test script is defined - tests should be added if needed

## Architecture Overview

### Tech Stack

- **Frontend**: React Native + Expo (SDK 53) with TypeScript
- **Authentication**: Clerk (Google & Apple OAuth)
- **Database**: Convex (real-time database with TypeScript functions)
- **UI**: React Native Paper (Material Design)
- **Navigation**: React Navigation (bottom tabs)
- **State Management**: React Query

### Project Type

A "Read Later" application for saving and organizing web content from other apps. Currently in Phase 4 of implementation (Convex integration).

### Key Directory Structure

- `app/`: Expo Router pages with tab navigation
  - `_layout.tsx`: Root layout with ClerkProvider and ConvexProvider
  - `(tabs)/`: Tab-based navigation screens
- `components/`: Reusable UI components (auth, themed, links)
- `convex/`: Backend functions and schema
  - `schema.ts`: Database schema (users, links tables)
  - `users.ts`: User CRUD operations
  - `links.ts`: Link management functions
  - `auth.config.ts`: Clerk authentication config
- `types/`: TypeScript type definitions

### Database Schema

Two main tables:

1. **users**: Clerk user data sync (clerkUserId, email, name, profileImage)
2. **links**: Saved links with metadata (url, title, description, tags, isRead, etc.)

### Authentication Flow

1. User signs in via Clerk OAuth (Google/Apple)
2. Clerk token is validated by Convex
3. User data automatically synced to Convex database
4. All database operations require authentication

### Key Patterns

- Use Convex queries/mutations for all data operations
- Authentication state managed by Clerk's `useAuth()` hook
- Real-time data subscriptions via Convex's `useQuery()`
- UI components use React Native Paper theming
- Environment variables in `.env.local` (CONVEX_URL, CLERK_KEY)

### Current Implementation Status

- ✅ Authentication with Clerk
- ✅ Convex database integration
- ✅ Basic UI with tab navigation
- ✅ Link saving and management functions
- 🚧 Share extension for saving from other apps
- 🚧 Link metadata extraction
- 🚧 AI-powered summaries

## Development Workflow Rules

### Pull Request Creation Process

When asked to create and merge a PR, **ALWAYS** follow this exact sequence:

1. **Create a new branch**:
   ```bash
   git checkout -b <branch-name>
   ```

2. **Make changes and commit appropriately**:
   - Group related changes into logical commits
   - Use descriptive commit messages
   - Include the standard footer:
     ```
     🤖 Generated with [Claude Code](https://claude.ai/code)
     
     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

3. **Push branch and create PR**:
   ```bash
   git push -u origin <branch-name>
   gh pr create --title "..." --body "..."
   ```

4. **Merge PR and clean up**:
   ```bash
   gh pr merge --squash --delete-branch
   git checkout main && git pull
   ```

**NEVER** commit directly to main branch. Always use feature branches and PRs, even for small changes.
