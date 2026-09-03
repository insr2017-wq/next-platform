# Plan - Membership Level System

Implement a comprehensive user level system (Bronze, Silver, Gold, Elite, Diamond) with visual badges, progress tracking, and level-gated products.

## User Review Required

> [!IMPORTANT]
> - Should levels be purely cosmetic for now (mock data), or do we want them persisted in a database (would require Lovable Cloud)?
> - Are the progress requirements (Investment R$ and Active Referrals) acceptable?
> - Which specific products should be locked? (Plan assumes products with higher investment amounts).

## Proposed Changes

### Configuration & Data Structure
- Create `src/constants/levels.ts` to define the hierarchy, colors, icons, and requirements for each level.
- Define 5 levels: **Bronze** (Earth/Bronze), **Prata** (Light Gray/Silver), **Ouro** (Yellow/Gold), **Elite** (Neon Green), **Diamante** (Light Blue/Diamond).

### UI Updates

#### Header & Profile Badges
- Update `src/components/Header.tsx` to dynamically render the user's level badge based on their current level.
- Update `src/routes/app/profile.tsx` to replace the static "Membro Elite" text with the dynamic level badge.

#### Progress Tracking (Profile)
- Add a "Progress to Next Level" card in `src/routes/app/profile.tsx`.
- Include a progress bar and details on the two criteria (Total Investment vs. Active Referrals).
- Visually highlight which criterion is closer to completion.

#### Level Gating (Products)
- Update `src/routes/app/products.tsx` to add a `requiredLevel` property to products.
- Implement a visual lock overlay for products above the user's current level.
- Disable the "Adquirir" (Acquire) button for locked products and show a message: "Disponível a partir do nível [X]".

## Technical Details
- **State Management**: Use a central hook or constant for the "Current User Level" (initially mock state).
- **Icons**: Utilize `Lucide` icons (`Trophy`, `Shield`, `Star`, `Crown`, `Gem`).
- **Styling**: Leverages existing Tailwind v4 theme variables and semantic colors defined in `src/styles.css`.
- **Logic**: Implement a helper function `isLevelUnlocked(userLevel, requiredLevel)` to handle gating.
