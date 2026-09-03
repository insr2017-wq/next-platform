# Plan - Nexus Tech UI Replication

Replicate the Nexus Tech app design based on provided reference images, including authentication, dashboard, products, team, and profile areas with full navigation.

## User Review Required

> [!IMPORTANT]
> The screenshots show a mobile-first UI (9:41 status bar). Should the app be strictly mobile-view or responsive for desktop as well?

- **Logo**: Do you have a high-res version of the Nexus logo, or should I recreate it with CSS/SVG?
- **Colors**: I've identified the neon green (#A3E635) and deep black (#05070A). Please confirm if these are correct.

## Proposed Changes

### Design & Assets
- Implement global styles with Tailwind v4 using the identified color palette.
- Set up Lucide icons matching the reference images.
- Create placeholder assets for products and banners.

### Routing & Layout
- Create a pathless layout `src/routes/_app` (or similar) to handle the persistent bottom navigation and header.
- Define routes:
    - `/auth/login`: The login screen with Google/Apple buttons.
    - `/`: The "Início" dashboard.
    - `/products`: The product catalog with search and filters.
    - `/team`: The referral and commission stats page.
    - `/profile`: User profile and settings.

### Components
- **Navbar**: Bottom tab bar with active states.
- **Header**: Top bar with logo, notifications, and user avatar.
- **Product Card**: Horizontal and grid variants as seen in images.
- **Stats Card**: For commission levels and user balance.
- **Modals**: The welcome/announcement popup.

### Implementation Details
- Use `framer-motion` for smooth transitions between tabs.
- Use `sonner` for notifications.
- Implement "Copy to clipboard" functionality for referral links.

## Technical Details
- **Framework**: TanStack Start v1 (React 19).
- **Styling**: Tailwind CSS v4.
- **State Management**: TanStack Router context and local state for UI interactions.
- **Components**: Custom components using `shadcn/ui` patterns (radix-ui primitives).
