---
name: Loyl
description: An on-chain event access credential, drawn as a black PVC pass on a venue-grey floor.
colors:
  venue-grey: "#eef0f3"
  ink: "#0c0d0f"
  panel: "#ffffff"
  raised-grey: "#e3e6eb"
  muted-ink: "#555a63"
  hairline: "#d9dde3"
  field-stroke: "#cdd2da"
  signal: "#c6f432"
  signal-ink: "#0c0d0f"
  pass: "#0e0f11"
  pass-ink: "#f2f3f5"
  pass-muted: "#8b8f98"
  band-bronze: "#e08a4b"
  band-silver: "#c3cbd6"
  band-gold: "#f2c94c"
  band-speaker: "#a48bff"
  band-ink: "#0e0f11"
  alert: "#b42318"
typography:
  display:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(3.75rem, 8vw, 7rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(3rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 62"
  title:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 0.92
    fontVariation: "'wdth' 62"
  lead:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
  body:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 84"
  data:
    fontFamily: "Martian Mono Variable, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "'tnum' 1"
rounded:
  chip: "4px"
  control: "8px"
  panel: "12px"
  pass: "5.5%"
spacing:
  hair: "4px"
  tight: "8px"
  snug: "12px"
  base: "16px"
  block: "24px"
  section: "48px"
  band: "80px"
  band-lg: "112px"
components:
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
    typography: "{typography.body}"
  button-signal-hover:
    backgroundColor: "#b6e12c"
  button-default:
    backgroundColor: "{colors.ink}"
    textColor: "#f4f5f7"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "48px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
    height: "32px"
  panel-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
  chip-tier:
    backgroundColor: "{colors.band-gold}"
    textColor: "{colors.band-ink}"
    rounded: "{rounded.chip}"
    padding: "0 8px"
    height: "24px"
    typography: "{typography.label}"
  chip-granted:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
    typography: "{typography.label}"
  chip-locked:
    backgroundColor: "rgb(12 13 15 / 0.07)"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
    typography: "{typography.label}"
---

# Design System: Loyl

## Overview

**Creative North Star: "The Access Credential"**

Loyl looks like the thing you wear around your neck at a conference, not like a trading card. The pass is a black PVC rectangle with a lanyard slot and a full-width access band in the tier colour, and everything else in the interface is the venue it hangs in: a cool daylight-grey floor, white panels, near-black ink, hairline rules instead of boxes. The credential is the only object with weight; the surfaces around it are flat, quiet, and operational.

Light is the primary scene because the product is demonstrated in a lit hall and on a projector, and used one-handed at a door under house lights. Dark follows the system and is a tint of the same world, never a different identity. A single access-lime signal (`#c6f432`) is the only saturated colour outside the pass bands: it marks primary action, granted access, and live state. Tier colour is strictly material — it exists on the pass band and on the access chip cut from that band, nowhere else.

Type does the shouting so colour does not have to. Condensed Archivo at 62% width and weight 800, set in caps at up to 7rem, is the credential lettering; Martian Mono appears only where a machine reads along with you — addresses, token ids, scores, gas figures, the pass's own data strip. Motion is one authored moment, not an ambient effect: the pass swings to rest when it appears, and on a tier change the old card drops out while the new one prints up under a lime scan line.

**Key Characteristics:**
- Cool daylight-grey ground, white panels, near-black ink; light is primary, dark follows the system
- One access-lime signal for primary action, granted, and live
- Tier colour only on pass bands and access chips
- Condensed caps display (Archivo, wdth 62, weight 800) against plain-width body text
- Mono reserved for machine-readable data
- Flat surfaces, hairline rules, one real cast shadow under the hanging pass
- Panels 12px, controls 8px, access chips 4px
- One authored motion moment, fully honouring `prefers-reduced-motion`

## Colors

A cool grey venue with near-black ink, one lime signal, and four tier colours that belong to the pass material.

### Primary
- **Access Lime** (`{colors.signal}`): The signal. Primary buttons (`signal` variant), the active nav underline, the lanyard strap, the re-issue scan line, the batch-gas bar, the "Access granted" and "Open" chips, the live-demo dot, the text selection highlight, and the row highlight for your own leaderboard entry. Always paired with near-black ink on top, never white.
- **Signal Ink** (`{colors.signal-ink}`): The only foreground colour permitted on lime.

### Secondary
- **Pass Black** (`{colors.pass}`): The credential's own body, and the full-bleed sections that behave as pass material (the batch-gas band, the tier cards on home). Identical to the contract renderer's `CARD`, so the web surface and the on-chain SVG read as one object.
- **Pass Ink** (`{colors.pass-ink}`) / **Pass Muted** (`{colors.pass-muted}`): Text on pass material; the muted value is the contract's `MUTED` and is used for the pass's own mono labels.

### Tertiary
- **Bronze** (`{colors.band-bronze}`), **Silver** (`{colors.band-silver}`), **Gold** (`{colors.band-gold}`), **Speaker Violet** (`{colors.band-speaker}`): Tier identity. Each appears as a full-width band across the pass and as the fill of an access chip, always with **Band Ink** (`{colors.band-ink}`) lettering. These four values are shared verbatim with `BadgeRenderer.sol` and are not free to drift.

### Neutral
- **Venue Grey** (`{colors.venue-grey}`): Page ground. The lit-hall floor the pass hangs against.
- **Panel White** (`{colors.panel}`): Cards, tables, and the header's translucent bar.
- **Raised Grey** (`{colors.raised-grey}`): Secondary buttons and quiet fills.
- **Ink** (`{colors.ink}`): Body text, default buttons, focus ring, and the 2px rules above feature rows.
- **Muted Ink** (`{colors.muted-ink}`): Supporting prose, table headers, mono captions.
- **Hairline** (`{colors.hairline}`) / **Field Stroke** (`{colors.field-stroke}`): Default borders and input strokes. In practice most rules are drawn as ink at 10–15% opacity so they thin out identically in both themes.
- **Alert** (`{colors.alert}`): Destructive and error states only, always as a 10–20% tint behind alert-coloured text rather than a solid red button.

### Named Rules
**The One Signal Rule.** Lime means *you may act* or *access is granted or live*. It never decorates, never fills a large area (the widest use is a 4px-tall gas bar and a 28px lanyard), and never carries white text.

**The Band-Only Rule.** Tier colour appears on a pass band and on an access chip cut from that band. It never becomes a text colour, a button, a border, or a page background.

**The Never-By-Colour-Alone Rule.** Every tier and every access state is named in words next to its colour ("Gold", "Access granted", "Needs Silver"). Colour is confirmation, never the message.

**The Shared-Palette Rule.** Pass black, pass ink, pass muted, and the four band colours are a contract between `web/src/index.css` and `contracts/src/BadgeRenderer.sol`. Change one side and you must change the other in the same commit.

## Typography

**Display Font:** Archivo Variable, condensed to 62% width at weight 800 (with Helvetica Neue, Arial)
**Body Font:** Archivo Variable at normal width (`wdth` 100)
**Label/Mono Font:** Martian Mono Variable (with ui-monospace, SF Mono, Menlo)

**Character:** One family doing two jobs. Squeezed to 62% and set in caps, Archivo is stamped credential lettering — tight (0.92 line-height, `-0.005em` tracking, `0.12em` word-spacing to keep the caps from welding together) and physically large. At normal width the same face is plain, neutral signage for reading. Martian Mono is the machine's voice and appears only where a scanner or a chain would read.

### Hierarchy
- **Display** (800, `clamp(3.75rem, 8vw, 7rem)`, 0.92, caps): The one statement per page — the home hero, `Claim your pass`, and the tier name on a live pass (which runs to `clamp(3.5rem, 10vw, 6rem)`).
- **Headline** (800, `clamp(3rem, 7vw, 5.5rem)`, 0.92, caps): Section openers and page titles.
- **Title** (800, 1.875–2.25rem, 0.92, caps): Sub-sections inside a page — `Route up`, `Doors`, `Ledger`, `Door code`.
- **Lead** (400, 1.125–1.25rem, 1.375): The one sentence under a display heading, capped at 38–60ch.
- **Body** (400, 1rem, 1.55): Prose and list rows, capped around 44–48ch.
- **Label** (700, 11–12px, `0.06em`, caps, `wdth` 84): Access chips and tier chips only. The 84% width is a distinct, less extreme condensation than display; it keeps small caps readable.
- **Data** (400, 0.75–1rem, tabular): Addresses, token ids, block numbers, scores, gas, thresholds, standard names (ERC-5192, EIP-712), and the pass's machine strip. Tabular numerals are opt-in per element (`.tabular`); the body default is `tnum 0`.

### Named Rules
**The Mono-Is-Machine Rule.** Martian Mono is for what a machine produced or reads: addresses, ids, numerals, counts, gas, and the pass's data strip. It is never used for prose, headings, buttons, or nav.

**The One Shout Rule.** A page gets exactly one display-scale heading. Everything below it steps down to Title; two competing 7rem headings on one screen is a bug.

**The Caps-Are-Condensed Rule.** Uppercase is only ever set in condensed Archivo (62% for headings, 84% for chips). Uppercase at normal width is not part of this world.

## Layout

A single centred column of `max-w-7xl` (1280px) with `16px` gutters that open to `32px` from the `sm` breakpoint up. Vertical rhythm is a 4px base; in practice the system uses a small set of steps — `8/12/16px` inside components, `24/48px` between blocks, and `80–112px` (`py-20` / `md:py-28`) between full-bleed sections. Page shells use `py-10` rising to `py-16`.

The recurring two-part composition is *pass on one side, words on the other*. Home's hero is `1.15fr / 1fr` at `md` and at least `min(100dvh - 4rem, 820px)` tall so the hanging pass is complete in the first viewport; the pass page is `minmax(0, 360px) / 1fr` (400px at `lg`) with the pass sticky at `top-24` while the details scroll. Below `md` both stack and the pass moves *above* the words (`order-1`), so a phone shows the credential first. The header is a sticky 64px bar with a blurred translucent ground.

Separation is done with rules, not containers: `border-y` hairlines at 15% ink around data lists, `divide-y` at 10% between rows, and a solid 2px ink rule above each feature or perk row. Data lists are always two-column baseline-aligned — label left in prose, value right in mono, `shrink-0 whitespace-nowrap` on the value so numbers never wrap.

**The Rules-Not-Boxes Rule.** Group content with a hairline and spacing first. Reach for a filled panel only when the content is a distinct object (a card table, a QR block, an empty state).

## Elevation & Depth

Flat by material. Surfaces are separated by tone (grey ground, white panel, black pass) and by 1px hairline rings at 10% ink — not by shadow. There is exactly one shadow in the system, and it is physical rather than decorative: the hanging pass casts a soft drop shadow onto the venue floor, because the pass is the only object in the world that is actually off the surface. Depth elsewhere comes from the pass-black full-bleed sections, which read as material laid over the grey ground.

### Shadow Vocabulary
- **Cast pass shadow** (`drop-shadow: 0 28px 36px rgb(12 13 15 / 0.22)`; dark `0 20px 28px rgb(0 0 0 / 0.35)`): The hanging credential only. Long, soft, and offset downward — a shadow thrown by a card on a lanyard, tightened in dark where the floor absorbs more light.
- **Hairline ring** (`ring: 1px rgb(12 13 15 / 0.10)`): The default substitute for elevation on cards, tables, and QR blocks.

### Named Rules
**The One Shadow Rule.** The cast shadow belongs to the hanging pass. Panels, buttons, chips, and dialogs are flat and take a hairline ring instead.

## Shapes

Three radii, assigned by what the thing is rather than by size. **Panels are 12px** (`rounded-xl`: cards, tables, state panels, the QR block). **Controls are 8px** (`rounded-md`/`rounded-lg`: buttons, inputs, tabs, the access-state pill) — small button sizes clamp to `min(8px, 10–12px)` so a 24px control never looks like a lozenge. **Access chips are 4px** (`rounded-sm`: tier chips, granted/open chips, the gas bars), the tightest corner in the system, because a chip is a slice cut from a pass band and a band has almost no corner at all.

The pass itself is the one exception and the one silhouette worth learning: a `540 × 860` portrait card (aspect `540/860`) with a `30px` corner — expressed on the web as a percentage radius (`5.5%`) so it scales with the art — a punched lanyard slot centred at the top, an inset hairline stroke just inside the edge, and a full-width band across the upper third. Every stand-in repeats that silhouette: the wordmark glyph, the mint page's dashed blank pass, and the loading skeleton all carry the slot and the band.

Borders are hairlines at 10–15% ink for structure and a solid 2px ink rule where a row needs to read as a filed entry. Dashes appear once, on the unissued pass, where "not yet printed" is the whole point.

## Components

### Buttons
Operational, not playful: flat fills, square-ish 8px corners, a 2% scale press, and a 150ms colour transition.
- **Shape:** Controls radius (8px); `xs`/`sm` sizes clamp to `min(8px, 10px)` / `min(8px, 12px)`.
- **Signal (primary):** Access lime with near-black ink, darkening ~8% on hover. Heights: 48px `lg` (the canonical primary CTA, `padding 0 24px`), 40px default. Exactly one signal button per view — mint, get your pass, check in, confirm a connection.
- **Default:** Ink fill with off-white text, 85% opacity on hover. Used where the action is administrative rather than the point of the page (resume a paused contract).
- **Outline:** Transparent with a 15% ink border rising to 30% on hover plus a 4% ink wash. The standard secondary, paired next to signal.
- **Ghost:** Fill-on-hover only (muted). Icon buttons, copy actions, menu toggles.
- **Destructive:** Alert-coloured text on a 10% alert tint, 20% on hover. Never a solid red fill.
- **Focus:** A 2px ink outline at 2px offset globally; in dark the ring becomes access lime.
- **Icons:** Phosphor SVG at `weight="bold"`, 16px at default size, flagged `data-icon="inline-start|inline-end"` which trims the adjacent padding by 2px.

### Chips
Two families, both 4px, both condensed bold caps with `0.06em` tracking, and both always accompanied by a word.
- **Tier chip:** Band colour fill with band ink, 24px tall, `0 8px`. This is the only place tier colour appears outside the pass.
- **Access-state chip:** Lime with signal ink when granted or open; a 6–7% ink wash with muted ink when locked. The perks page renders the same states as a larger 8px pill with a lock icon.

### Cards / Containers
- **Corner Style:** Panel radius (12px), content clipped to it.
- **Background:** Panel white on the grey ground; pass black when the panel is meant to read as credential material.
- **Shadow Strategy:** None — a 1px ring at 10% ink (see Elevation).
- **Border:** Ring only; internal divisions are 10% ink `divide-y`.
- **Internal Padding:** 16px in dense cards, 24px rising to 32px for feature panels and empty states.

### Inputs / Fields
- **Style:** Transparent fill with a `field-stroke` 1px border, 8px radius, 32px tall, `4px 10px` padding, 1rem text dropping to 0.875rem at `md`. In dark the field takes a 30% ink wash.
- **Focus:** Border shifts to the ring colour plus a 3px ring at 50% opacity.
- **Error / Disabled:** `aria-invalid` swaps border and ring to alert; disabled is 50% opacity with a filled field and no pointer events.

### Navigation
15px medium-weight links in muted ink, brightening to full ink on hover. The active route is marked by a 3px access-lime bar sitting on the header's bottom edge — the only nav decoration. The mobile menu drops below the bar as a full-width stack of 18px rows on 10% hairlines. The wordmark is the pass glyph plus `LOYL` in 26px condensed display.

### The Pass (signature component)
The credential is an SVG the contract generates and the web app displays as an image; the app never re-draws it. Around it the app supplies the staging:
- **Lanyard:** A 28px lime strap running up off the top of the section, printed with vertical `LOYL — EVENT` in 10px condensed caps at 80% signal ink, ending in a grey metal clip that holds the pass by its slot.
- **Swing:** On first appearance the pass enters at `4.5°` and settles with a damped spring (stiffness 42, damping 7, mass 1), pivoting from `50% -40%` — above the frame, where the strap would be. It settles; it never snaps or loops.
- **Re-issue:** On a tier change the old image exits down 18px while the new one enters from 28px below over 550ms on `cubic-bezier(0.16, 1, 0.3, 1)` with a 150ms delay, and a 3px lime scan line crosses top to bottom over 1.1s. This is the product's one authored moment.
- **Reduced motion:** With `prefers-reduced-motion`, the swing and the scan line do not run at all and the re-issue becomes a 150ms cross-fade; a global rule also collapses every animation and transition to 0.01ms.
- **Stand-ins:** Loading is a pulsing pass-black rectangle at the same aspect and radius; unissued is a 2px dashed outline carrying a dashed slot, an empty band, and `BRONZE` ghosted at 25% ink.

### Reveal (signature behaviour)
Content enters by lifting 18px into place over 700ms on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered `0.07s` per sibling, once per element. Opacity is *not* animated — content is fully legible on the first frame, so a projector, a slow phone, or a screenshot never catches a half-faded page.

## Do's and Don'ts

### Do:
- **Do** keep light the primary scene and let dark follow the system as a tint of the same world.
- **Do** spend access lime on one primary action per view, plus granted and live states.
- **Do** name every tier and access state in words beside its colour.
- **Do** assign radius by kind: panels 12px, controls 8px, access chips 4px.
- **Do** set Martian Mono for addresses, ids, numerals, gas, and the machine strip, with `.tabular` on anything that changes in place.
- **Do** set uppercase only in condensed Archivo (`wdth` 62 for headings, 84 for chips).
- **Do** separate content with hairline rules and space before reaching for a filled panel.
- **Do** keep the pass silhouette — slot, band, 5.5% corner — in every stand-in for a pass.
- **Do** animate position, not opacity, for entrances, and gate the swing and scan line behind `prefers-reduced-motion`.
- **Do** change `web/src/index.css` and `BadgeRenderer.sol` together when touching pass black, pass ink, pass muted, or a band colour.

### Don't:
- **Don't** put white text on access lime; `signal-ink` is the only foreground it takes.
- **Don't** let tier colour leave the pass band and the access chip — not as text, border, button, or background.
- **Don't** give a panel, button, chip, or dialog a shadow; the cast shadow belongs to the hanging pass.
- **Don't** set prose, headings, buttons, or nav in Martian Mono.
- **Don't** put two display-scale headings on the same screen.
- **Don't** set uppercase at normal width, or condense body prose.
- **Don't** use a solid red destructive fill; destructive is alert text on an alert tint.
- **Don't** loop, snap, or restart the pass swing — it is a damped settle that happens once.
