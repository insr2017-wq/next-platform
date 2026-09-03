# Plan: Authentication System (Login & Register)

Implement a high-fidelity authentication system based on the Nexus Tech design screenshots, including a login page and a registration flow with referral codes.

## User Review Required

> [!IMPORTANT]
> - Do you want real authentication (Supabase) or just a UI simulation for now?
> - Should the referral code be mandatory or optional during registration?

## Proposed Changes

### Design & Assets
- Create a reusable `AuthLayout` component for consistent branding (logo, background).
- Implement the "Nexus Tech" logo using SVG or Lucide icons as seen in the reference.

### Components
- `LoginForm`: Phone/email and password fields, social login buttons (Google, Apple).
- `RegisterForm`: Phone number, password, and referral code (convite) fields.
- `AuthCard`: The glassmorphic/dark surface container for auth forms.

### Routing
- Update `src/routes/index.tsx` to act as the entry point, checking auth and showing the login screen.
- Create `src/routes/auth/login.tsx` and `src/routes/auth/register.tsx`.
- Configure redirects: Unauthenticated users to `/auth/login`, authenticated to `/app`.

### Features
- Toggle between Login and Register views.
- "Remember me" and "Forgot password" UI elements.
- Secure account badge/message as seen in the footer of the reference image.

## Technical Details

- **State Management**: Use TanStack Router for navigation between auth states.
- **Form Handling**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS v4 with the established neon green (`#A3E635`) and dark (`#05070A`) theme.
- **Animations**: Framer Motion for smooth transitions between login and register forms.
