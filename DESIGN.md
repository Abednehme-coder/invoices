# Design

## Theme

Light. Used in a physical shop under ambient/incandescent light, on a phone screen.
Color strategy: **Restrained** — one saturated warm orange as primary, tinted neutrals everywhere else.
Scene: "A shop counter in late afternoon light. Copper hardware, warm incandescent bulb, the owner tapping deliberate on a phone."

---

## Color

All values in OKLCH.

### Base

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `oklch(1.000 0.000 0)` | Page background — pure white |
| `--color-surface` | `oklch(0.975 0.005 49)` | Cards, panels, input fields |
| `--color-surface-raised` | `oklch(0.955 0.007 49)` | Elevated cards, modals |
| `--color-border` | `oklch(0.900 0.006 49)` | Dividers, input borders |
| `--color-border-subtle` | `oklch(0.940 0.004 49)` | Very subtle separators |

### Ink

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `oklch(0.16 0.012 49)` | Primary text — warm near-black |
| `--color-ink-muted` | `oklch(0.48 0.008 49)` | Secondary text, labels |
| `--color-ink-faint` | `oklch(0.70 0.005 49)` | Placeholders, disabled, timestamps |

Contrast checks: ink vs bg ≈ 16:1 ✓ · muted vs bg ≈ 4.6:1 ✓ · faint vs bg ≈ 3.1:1 (placeholders only)

### Brand

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `oklch(0.58 0.18 49)` | Buttons, active nav, focus rings |
| `--color-primary-hover` | `oklch(0.52 0.19 49)` | Button hover |
| `--color-primary-active` | `oklch(0.48 0.20 49)` | Button press |
| `--color-primary-subtle` | `oklch(0.95 0.04 49)` | Highlighted rows, selected state bg |
| `--color-primary-text` | `oklch(1.000 0.000 0)` | Text on primary fills (white) |

### Accent

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `oklch(0.30 0.04 280)` | Balances, stable data, links |
| `--color-accent-subtle` | `oklch(0.94 0.03 280)` | Accent bg for badges |
| `--color-accent-text` | `oklch(1.000 0.000 0)` | Text on accent fills |

### Status

| Token | Value | Use |
|---|---|---|
| `--color-unpaid` | `oklch(0.58 0.18 49)` | Unpaid badge — orange (same as primary) |
| `--color-unpaid-bg` | `oklch(0.95 0.04 49)` | Unpaid badge background |
| `--color-partial` | `oklch(0.68 0.14 72)` | Partial badge — amber |
| `--color-partial-bg` | `oklch(0.95 0.06 80)` | Partial badge background |
| `--color-paid` | `oklch(0.50 0.12 155)` | Paid badge — green |
| `--color-paid-bg` | `oklch(0.94 0.06 155)` | Paid badge background |
| `--color-danger` | `oklch(0.54 0.18 25)` | Delete, destructive actions |
| `--color-danger-bg` | `oklch(0.96 0.04 25)` | Danger subtle bg |

---

## Typography

Font: **Cairo** (Google Fonts) — handles Arabic and Latin in one family, geometric, clear numerals.
Loaded weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).

```html
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
--font-body: 'Cairo', 'Segoe UI', system-ui, sans-serif;
```

### Scale (mobile-first, rem base = 16px)

| Name | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `--text-display` | `clamp(1.75rem, 6vw, 2.5rem)` | 700 | 1.15 | Dashboard total amount |
| `--text-xl` | `1.25rem` | 600 | 1.3 | Page headings |
| `--text-lg` | `1.125rem` | 600 | 1.35 | Section headings, invoice name |
| `--text-md` | `1rem` | 400/500 | 1.5 | Body, list items |
| `--text-sm` | `0.875rem` | 400 | 1.5 | Labels, secondary info |
| `--text-xs` | `0.75rem` | 400 | 1.4 | Timestamps, reference numbers, fine print |

Currency amounts always use: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum";`

---

## Spacing

4px base grid.

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

Page horizontal padding: `--space-4` (16px) on mobile.
Bottom nav height: 64px. Content must have `padding-bottom: calc(64px + env(safe-area-inset-bottom))`.

---

## Radius

```
--radius-sm:  6px   (inputs, small badges)
--radius-md:  10px  (cards, modals)
--radius-lg:  16px  (bottom sheets, large modals)
--radius-full: 999px (pills, avatar, voice button)
```

---

## Shadows

```
--shadow-sm:  0 1px 3px oklch(0.16 0.012 49 / 0.08), 0 1px 2px oklch(0.16 0.012 49 / 0.06);
--shadow-md:  0 4px 12px oklch(0.16 0.012 49 / 0.10), 0 2px 4px oklch(0.16 0.012 49 / 0.06);
--shadow-lg:  0 8px 32px oklch(0.16 0.012 49 / 0.12), 0 4px 8px oklch(0.16 0.012 49 / 0.08);
```

---

## Motion

Minimal. Data app — transitions confirm state, not decorate.

```
--duration-fast:   120ms
--duration-normal: 200ms
--duration-slow:   300ms
--ease-out:        cubic-bezier(0.22, 1, 0.36, 1)
```

- Button press: scale(0.97), 120ms
- Modal enter: translateY(8px) → 0, opacity 0 → 1, 200ms ease-out
- Page transitions: opacity 0 → 1, 150ms
- Voice recording pulse: scale 1 → 1.08, infinite, 800ms ease-in-out

All animations: `@media (prefers-reduced-motion: reduce)` → instant.

---

## Layout

### Z-index scale

```
--z-base:    0
--z-sticky:  10   (bottom nav, sticky headers)
--z-overlay: 20   (dropdown menus)
--z-modal:   30   (sheets, dialogs)
--z-toast:   40   (notifications)
```

### Navigation — bottom tabs (mobile)

5 tabs: Dashboard · New Invoice (+) · Clients · Archive · Settings  
Center tab (New Invoice) is visually elevated — larger icon, primary color fill.  
Tab height: 64px + safe area.

### RTL rules

- `<html dir="rtl" lang="ar">` always set
- Use Tailwind `rtl:` variant for directional overrides
- Directional icons (arrows, chevrons, back): `rtl:scale-x-[-1]`
- WhatsApp link, reference numbers (INV-0001), currency amounts: always `dir="ltr"` inline
- Flex rows maintain visual direction automatically in RTL

---

## Components

### Status Badge

```
unpaid:  bg --color-unpaid-bg, text --color-unpaid, dot • , label "غير مدفوع"
partial: bg --color-partial-bg, text --color-partial, dot ◑ , label "جزئي"
paid:    bg --color-paid-bg, text --color-paid, dot ✓ , label "مدفوع"
```

Never color alone — always dot/icon + label.  
Pill shape: `--radius-full`, `--space-2` vertical, `--space-3` horizontal.

### Invoice Row

```
[ Reference INV-0001 ]  [ Status Badge ]
[ Client Name         ]  [ Amount       ]
[ Description snippet ]  [ Date         ]
```

Tap → Invoice Detail. No swipe actions (too complex for non-tech users).  
Amount always right-aligned in RTL (which is the visual left).

### Currency Display

Format rule:
- USD: `$1,250.00` (always 2 decimal places)
- LBP: `1,250,000 ل.ل.` (no decimal, Arabic pound abbreviation)

Display component always shows both when context allows:
```
$1,250.00
112,000,000 ل.ل.
```

### Voice Button

Round, 56px diameter, `--color-primary` fill, white mic icon.  
States: idle → pulse animation while recording → checkmark on complete.  
Touch target: entire button. Long-press alternative = same as tap.

### Bottom Sheet (modals)

Slides up from bottom. `--radius-lg` top corners. Drag handle bar at top.  
Max height 85vh. Scrollable interior.

### Empty States

Not "no data" generic. Specific per context:
- No clients: "أضف أول عميل"  
- No invoices: "أنشئ فاتورة جديدة"
- No results in search: "لا توجد نتائج"

Each with a simple icon, one-line message, and an action button.

---

## Pages Map

| Route | Page | Primary Action |
|---|---|---|
| `/login` | Login | Sign in |
| `/` | Dashboard | View totals + active invoices |
| `/invoices/new` | New Invoice | Create invoice |
| `/invoices/:id` | Invoice Detail | View + WhatsApp |
| `/clients` | Clients List | Browse clients |
| `/clients/:id` | Client Detail | View balance + pay |
| `/clients/:id/pay` | Record Payment | Confirm payment |
| `/archive` | Archive | Search paid invoices |
| `/settings` | Settings | Update rate + password |
