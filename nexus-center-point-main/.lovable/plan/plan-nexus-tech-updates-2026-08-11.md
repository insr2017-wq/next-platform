---
title: Nexus Tech Product & Notification Updates
description: Implement product card details, purchase confirmation modal, my products card enhancements, and functional notifications header.
type: feature
---

# Plan - Nexus Tech Updates

Implement the requested updates for the Products screen and the Header notifications.

## Proposed Changes

### Products Screen (`src/routes/app/products.tsx`)
- **Product Cards Update**: 
    - Remove description text.
    - Add investment details: "Investido" (price), "Retorno" (value + 150%), "Duração" (30 days).
    - Use the same icon/style as "Meus Produtos Adquiridos".
- **Purchase Confirmation Modal**:
    - Add state to manage a confirmation modal (`ProductConfirmationModal`).
    - Display product name, image, and specific confirmation text with return details.
    - Implement "Confirmar" (adds to list + success toast) and "Cancelar" buttons.
- **My Products Card Enhancements**:
    - Ensure acquisition date/time is shown.
    - Add "Expiração do rendimento" field (calculated as +24h from purchase).
    - Maintain existing investment/return/duration stats.
- **Mock Data Logic**:
    - Update `AVAILABLE_PRODUCTS` with duration/return fields.
    - Update `MY_PRODUCTS` to include acquisition timestamps and expiration mocks.

### Header & Notifications (`src/components/Header.tsx` & new `src/components/notifications/NotificationDropdown.tsx`)
- **Functional Notification Bell**:
    - Create a `NotificationDropdown` component using Radix UI / Shadcn `Popover`.
    - Implement a list of mock notifications (Bonus codes, system messages).
    - Add "Copiar código" functionality for bonus notifications with toast feedback.
    - Implement "mark as read" logic to zero the badge counter when opened.

## Technical Details
- **State Management**: Use `useState` for the purchase modal and notification list/read status.
- **Components**:
    - `ProductConfirmationModal`: A new local or shared component for the confirmation flow.
    - `NotificationDropdown`: A popover component anchored to the bell icon.
- **Icons**: Lucide `Package`, `TrendingUp`, `Clock`, `Calendar`, `Ticket`, `Copy`, `CheckCircle2`.
- **Animations**: `framer-motion` for modal transitions and dropdown fade-in.

## User Review Required

> [!IMPORTANT]
> - Should the "Meus Produtos" list reset on page refresh (mock only) or should I use `localStorage` to keep it persistent for this session?
> - Is the 150% return and 30 days duration standard for all products, or should it vary per product as per the mock data?
