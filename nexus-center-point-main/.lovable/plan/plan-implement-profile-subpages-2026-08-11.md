# Plan: Implement Profile Subpages

I will implement the six subpages requested for the Profile menu: Recharge History, Withdrawal History, Bonus Redemption, Full History, Account Security, and Customer Support. All pages will follow the established Nexus Tech dark-tech visual language.

## User Review Required

> [!IMPORTANT]
> - I will use mock data for all history records as requested.
> - The "PIX" method will be hardcoded as the default for recharges and withdrawals in these views.
> - I'll be using high-quality tech imagery from Unsplash for the Bonus page hero section.

- **Mock Data**: Should I include specific amounts or dates in the mock data, or just a few varied examples?
- **Visuals**: Are there any specific tech icons from Lucide you'd prefer for "Account Security" or "Support"?

## Proposed Changes

### Routes & Components

#### [NEW] `src/routes/app/recharge-history.tsx`
- Implement the "Registro de Recargas" screen.
- Summary card for total recharged.
- List of recharge items (value, date, status, PIX icon).

#### [NEW] `src/routes/app/withdraw-history.tsx`
- Implement the "Registro de Saques" screen.
- Summary card for total withdrawn.
- List of withdrawal items (value, date, status, Pix key).

#### [NEW] `src/routes/app/bonus.tsx`
- Implement the "Resgatar Código Bônus" screen.
- Hero section with tech image and referral-style text.
- Input field and redeem button with toast feedback.

#### [NEW] `src/routes/app/history.tsx`
- Implement the "Histórico Completo" screen.
- Three tabs: Recargas, Saques, Bônus.
- Reusable list components for each tab.

#### [NEW] `src/routes/app/security.tsx`
- Implement the "Segurança da Conta" screen.
- List menu with Lucide icons for Password, 2FA, and Active Sessions.

#### [NEW] `src/routes/app/support.tsx`
- Implement the "Atendimento ao Cliente" screen.
- Contact buttons (WhatsApp, Email, Chat).
- Accordion for FAQ.

#### [MODIFY] `src/routes/app/profile.tsx`
- Update the `MENU_ITEMS` array to link to these new routes.

## Technical Details

- **Navigation**: All pages will use the `Header` component (with back button) and `BottomNav`.
- **Styling**: Tailwind CSS with Nexus Tech tokens (`bg-surface`, `text-primary`, `border-border`).
- **Animations**: `framer-motion` for tab transitions and page entrance.
- **Components**: `shadcn/ui` tabs and accordion components.
