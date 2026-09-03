# Plan: Implementation of "Sacar Dinheiro" (Withdraw) Screen

Implement a high-fidelity "Sacar Dinheiro" screen for Nexus Tech, following the established neon-dark design system. The screen will feature a two-step flow: registration of a PIX key (if not already present) and the withdrawal request itself.

## User Review Required

> [!IMPORTANT]
> The withdrawal flow depends on a registered PIX key. I will implement a mock state that defaults to "no key registered" so you can test the first step, then allow "saving" it to proceed to the withdrawal step.

- **Mock Balance**: Should I use a fixed balance (e.g., R$ 1.250,00) or try to link it to a global state? (Defaulting to R$ 1,250.00 for consistency with the profile).

## Technical Details

### New Route & Component
- Create `src/routes/app/withdraw.tsx`.
- Implement a two-state flow (`step`: 'register' | 'request').

### Features
- **Header**: Back button + "Sacar Dinheiro" title.
- **Balance Card**: "Saldo disponível" label (gray) + bold neon green value.
- **Step 1 (Register PIX)**:
  - Form fields: "Nome do titular", "Tipo de chave Pix" (Toggle: CPF / Telefone), "Chave Pix", "CPF do titular".
  - "Salvar chave Pix" button (Black/Rounded).
  - Feedback toast using `sonner`.
- **Step 2 (Request Withdrawal)**:
  - Display registered key details with an "Editar" option.
  - "Valor do saque" input with "R$" prefix.
  - "Solicitar saque" button.
- **Tutorial Section**: Mini-tutorial in text format at the bottom.

### Styling
- Use the project's color tokens: `bg-background` (`#05070A`), `bg-surface` (`#0D1117`), `text-primary` (`#A3E635`).
- Rounded corners (`rounded-2xl`, `rounded-xl`), Lucide icons, and `framer-motion` for transitions between steps.

### Integration
- Link the "Sacar Dinheiro" button in `src/routes/app/index.tsx` to `/app/withdraw`.
- Link the "Registro de saques" menu in `src/routes/app/profile.tsx` to `/app/withdraw`.
