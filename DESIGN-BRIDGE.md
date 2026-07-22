# Design Bridge — I AM × Nagare Sol

## Reference
- **Design system**: Nagare Sol v1.0.0
- **Spec file**: Nagare Sol.md (Google Drive folder "Nagare Sol")
- **Live showcase**: Nagare Sol.html (bundled reference in same folder)
- **Token namespace**: `--sol-*`

## App token system
CSS custom properties in `src/app/globals.css`. Two layers:
1. **Primitive sol tokens** (`--sol-paper`, `--sol-coral-500`, etc.) — raw values, named by what they are
2. **Semantic app vars** (`--cream`, `--terracotta`, etc.) — named by role, point to sol values

Components reference the semantic vars; primitives allow direct `var(--sol-*)` access when needed (e.g. `--sol-navy` for the daily insight card).

## Token mapping

| App var | Sol token | Hex | Role |
|---|---|---|---|
| `--cream` | `--sol-sand` | `#F4EBDD` | Main app background |
| `--warm-white` | `--sol-paper` | `#FBF6EE` | Card surfaces |
| `--parchment` | `--sol-greige` | `#E4D9C6` | Borders, hairlines, dividers |
| `--terracotta` | `--sol-coral-500` | `#EE6C5A` | Primary action (buttons, CTAs) |
| `--terracotta-light` | `--sol-coral-300` | `#F7B3A6` | Soft accent, disabled |
| `--rust` | `--sol-coral-700` | `#DA5442` | Hover/pressed state |
| `--sage` | `--sol-moss-500` | `#5F7B4E` | Accent green (progress, nature) |
| `--sage-light` | `--sol-moss-300` | `#A6B694` | Muted green |
| `--warm-brown` | `--sol-navy` | `#202A43` | Secondary dark surface |
| `--warm-brown-light` | `--sol-teal-500` | `#2F5C6E` | Teal accent |
| `--gold` | `--sol-coral-500` | `#EE6C5A` | Maps to persimmon (one accent rule) |
| `--forest` | `--sol-navy` | `#202A43` | Navy dark |
| `--moss` | `--sol-moss-500` | `#5F7B4E` | Sol moss |
| `--text-primary` | `--sol-ink` | `#23252C` | Body text |
| `--text-secondary` | `--sol-ink-muted` | `#79736A` | Secondary text |
| `--text-muted` | `--sol-ink-faint` | `#A2937D` | Captions, placeholders |

## Font system

| Role | Family | Weights loaded | CSS var |
|---|---|---|---|
| Serif/display | Cormorant | 400/500/600/700 + italic | `--font-serif` |
| Sans/UI/body | Outfit | 300/400/500/600/700 | `--font-sans` |
| Mono/labels | Space Mono | 400/700 | `--font-mono` |

**Important**: Cormorant supports real bold weights (no browser synthesis). Headings can safely use `font-semibold` (600) or `font-bold` (700). Previous Gilda Display only had weight 400, requiring `font-normal` everywhere — that restriction is now lifted.

**Type scale** (from Nagare Sol spec):
- Display: Cormorant 600, 92px / 0.98 lh / -0.015em tracking
- H1: Cormorant 600, 56px / 1.04 lh
- H2: Cormorant 600, 40px / 1.08 lh
- H3: Outfit 600, 24px / 1.3 lh
- Label: Space Mono 400, 12px / 0.2em tracking / UPPERCASE

## Inline rgba values
Old palette rgba values have been updated throughout components:
- Old gold `rgba(201,169,110,…)` → coral `rgba(238,108,90,…)` (sol-coral-500)
- Old moss `rgba(92,138,69,…)` → sol-moss `rgba(95,123,78,…)` (sol-moss-500)

## Special surfaces
- **Daily insight card** (DashboardClient, DailyView): `background-color: var(--sol-navy)` — immersive navy per "one accent per screen" rule (coral is reserved for buttons)
- **Card elevation**: `0 1px 2px rgba(32,42,67,.12)` (rest) / `0 16px 30px -20px rgba(32,42,67,.5)` (hover) — navy-tinted per Nagare Sol elevation spec

## Cascade notes
- No `!important` in use — all changes applied through the token layer
- Buttons use `linear-gradient(135deg, var(--terracotta), var(--rust))` → resolves to coral-500 → coral-700
- Shimmer text uses coral gradient: `#EE6C5A → #F7B3A6 → #EE6C5A`
- `--sol-navy` is also directly referenced in a few components for the daily card (not through semantic var, because it has no app-level equivalent)
