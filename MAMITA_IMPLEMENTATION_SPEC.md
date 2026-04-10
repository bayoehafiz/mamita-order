# Mamita Portal Implementation Spec

## Purpose

This document turns the current PRD into a build-ready implementation spec for the Mamita preorder portal.

The MVP is not a full order management system. It is a:

- mobile-first preorder landing page
- structured order form
- WhatsApp handoff flow
- small seller-controlled config system

The product should reduce chat chaos without changing the seller's real operating model.

---

## Product Definition

### Core Job To Be Done

Help buyers submit preorder intent in a clean format, then continue the final confirmation inside WhatsApp.

### MVP Summary

The buyer:

1. opens a link from a WhatsApp broadcast
2. sees product details, pack info, PO state, and stock
3. fills a short form
4. gets redirected to WhatsApp with a prefilled message
5. taps `Send` in WhatsApp to complete the handoff

The seller:

1. updates stock and PO state from a simple admin source
2. receives standardized messages in WhatsApp
3. continues payment and fulfillment manually

### Non-Goals For MVP

- customer accounts
- payment gateway
- backend-owned order records
- real-time inventory reservation
- delivery tracking
- kitchen automation

---

## Architecture Decision

### Chosen Approach

Use **Next.js + Vercel + server-side Supabase config fetch**.

### Why

- lowest friction for the seller
- fastest to ship
- lowest maintenance cost
- no auth/admin subsystem needed yet
- keeps the portal focused on conversion, not operations software

### Important Caveat

`available_stock` is **advisory**, not authoritative.

Because the order is only finalized when the customer sends the WhatsApp message and the seller confirms it, the system can still oversell if multiple buyers act at once.

This is acceptable for MVP as long as:

- the UI communicates that final confirmation happens in WhatsApp
- the seller updates stock regularly
- sold-out and closed states are explicit

### Revisit Trigger

Move to `/admin + DB` only when one of these becomes true:

- orders must be stored before WhatsApp handoff
- payment receipt uploads are needed
- kitchen calculations must use actual stored orders
- multiple admins update stock
- audit/history becomes necessary
- inventory reservation must be accurate

---

## MVP User Flows

### Buyer Happy Path

1. User opens the landing page from WhatsApp.
2. User sees:
   - product name
   - `1 pack isi 5 pcs`
   - key benefits
   - PO state
   - stock badge
3. User taps `Pesan via WhatsApp`.
4. User fills:
   - name
   - WhatsApp number
   - quantity
   - delivery method
   - address if required
5. User taps submit.
6. App validates input.
7. App generates WhatsApp message.
8. App opens WhatsApp with prefilled text.
9. User taps `Send`.

### Buyer Sold Out Path

1. User opens page.
2. Page shows `SOLD OUT` or `PO Ditutup`.
3. Order form is replaced or disabled.
4. Secondary CTA appears:
   - `Chat Mamita untuk batch berikutnya`

### Seller Config Path

1. Seller updates Supabase config values (via `/admin` panel):
   - `is_open`
   - `available_stock`
   - `price_label`
   - enabled delivery methods
   - seller number
2. Website reads the latest row from Supabase server-side.
3. Landing page reflects updated state.

---

## Operational Rules

These rules must exist before implementation.

### PO States

The site supports exactly 3 user-facing states:

- `OPEN`
- `CLOSED`
- `SOLD_OUT`

### State Logic

- `OPEN` when `is_open = true` and `available_stock > 0`
- `SOLD_OUT` when `is_open = true` and `available_stock <= 0`
- `CLOSED` when `is_open = false`

### Quantity Rules

- minimum quantity: `1`
- maximum quantity: configurable or bounded by visible stock
- user cannot submit quantity above current displayed stock

### Delivery Rules

Supported options:

- `Pickup`
- `Grab/Gojek`
- `Diantar Seller`

Address rules:

- `Pickup`: address not required
- `Grab/Gojek`: address required
- `Diantar Seller`: address required

### Fulfillment Rules

The site must clearly state:

- order confirmation is finalized in WhatsApp
- total payment may be confirmed manually by seller
- delivery fee, if any, is confirmed in WhatsApp unless fixed beforehand

---

## Acceptance Criteria

### Landing Page

- Main banner or banner-derived visual appears prominently.
- Product name and pack format are visible above the fold.
- A single dominant PO status is shown.
- Remaining stock is shown only when valid.
- Primary CTA is visible above the fold on mobile.

### Form

- Name, WhatsApp number, and quantity are required.
- Delivery method is required.
- Address is conditionally required.
- Invalid WhatsApp numbers are blocked with inline error text.
- Quantity below 1 or above allowed max is blocked.

### WhatsApp Handoff

- Clicking submit constructs a URL-encoded WhatsApp message.
- Generated message uses consistent labels.
- Message includes `Pickup` when no address is needed.
- User sees a transitional state before redirect.
- If redirect fails, user can copy the message manually.

### Closed / Sold Out

- When PO is closed, the order form is unavailable.
- When stock is zero, the UI switches to sold-out messaging.
- Closed and sold-out states should still allow direct WhatsApp contact if desired.

### Admin Config

- Seller can update stock and open/close state without touching code.
- Config fetch happens server-side only.
- If config fetch fails, the site falls back safely to `CLOSED`.

---

## UX Direction

### Product Positioning

This should feel like:

- warm
- bold
- appetizing
- urgent
- easy to order

Not like:

- generic startup SaaS
- minimal luxury restaurant
- dashboard software

### Mobile-First Layout

Recommended structure:

1. Hero
2. Benefit highlights
3. Order form
4. Trust / process note
5. Sticky bottom CTA

### Above-the-Fold Requirements

The first screen should answer:

- what is the product?
- why should I want it?
- is PO open?
- how do I order now?

### Visual Direction

Use the broadcast banner as source material, not as the entire layout.

Suggested palette direction:

- deep chili red / orange
- warm yellow / gold for highlights
- dark brown / charcoal for grounding
- cream / warm neutral backgrounds
- WhatsApp green only for WhatsApp-specific CTA accents

Suggested visual traits:

- bold headline typography
- chunky urgency badges
- tactile cards
- warm glow or gradient accents
- strong product photography focus

Avoid:

- glassmorphism
- generic startup blue
- long-scroll promo sections before form
- tiny tap targets
- multiple competing urgency widgets

---

## Screens / Routes

### `/`

Main landing and order page.

Contains:

- hero section
- product benefit section
- stock / PO state badge
- order form
- trust note
- sticky WhatsApp CTA

### Optional future routes

- `/sold-out` only if a dedicated campaign page is needed later
- no `/admin` in MVP

---

## Component List

### `HeroSection`

Responsibilities:

- show product identity
- show pack info
- show primary benefit summary
- show PO state and stock
- show primary CTA

### `StockBadge`

Responsibilities:

- render `OPEN`, `SOLD_OUT`, or `CLOSED`
- show `Sisa X pack` when valid
- visually differentiate state clearly

### `BenefitList`

Suggested copy:

- `Isi full bihun + bumbu spesial`
- `Lembut di dalam`
- `Sambal petis khas Surabaya`

### `OrderForm`

Fields:

- `name`
- `phone`
- `quantity`
- `deliveryMethod`
- `address`

Responsibilities:

- render short mobile-first form
- validate inline
- conditionally reveal address field
- preserve state on navigation back if possible

### `QuantityStepper`

Responsibilities:

- increment/decrement quantity
- prevent invalid values
- easier mobile input than plain typing

### `DeliveryMethodSelector`

Responsibilities:

- render radio-style options
- clearly explain address requirement

### `WhatsAppSubmitButton`

Responsibilities:

- validate before submit
- show `Menyiapkan WhatsApp...`
- open generated WhatsApp link

### `FallbackMessageBox`

Shown only if redirect fails or user needs manual copy.

Responsibilities:

- show generated order text
- provide `Copy Pesanan`
- provide retry CTA

### `TrustStrip`

Suggested items:

- `PO dibalas via WhatsApp`
- `Tanpa akun`
- `Alamat hanya diminta jika perlu delivery`

### `StickyMobileCTA`

Responsibilities:

- remain visible after hero on mobile
- keep primary action in thumb zone

---

## State Model

### Remote Config State

```ts
type PortalState = {
  isOpen: boolean;
  availableStock: number;
  productName: string;
  packLabel: string;
  sellerWhatsappNumber: string;
  pickupEnabled: boolean;
  courierEnabled: boolean;
  sellerDeliveryEnabled: boolean;
  priceLabel: string;
  announcementText?: string;
  updatedAt?: string;
};
```

### Derived UI State

```ts
type AvailabilityState = "OPEN" | "CLOSED" | "SOLD_OUT";
```

Derivation:

- `CLOSED` if `isOpen === false`
- `SOLD_OUT` if `isOpen === true && availableStock <= 0`
- `OPEN` otherwise

### Form State

```ts
type OrderFormState = {
  name: string;
  phone: string;
  quantity: number;
  deliveryMethod: "pickup" | "courier" | "seller_delivery" | "";
  address: string;
};
```

---

## Supabase Table Schema

Use a single table named `portal_state` with one authoritative row.

### Recommended Columns

| column | type | notes |
|---|---|---|
| `id` | integer | primary key (default to `1`) |
| `is_open` | boolean | controls open vs closed |
| `available_stock` | integer | advisory stock count |
| `product_name` | text | `Martabak Bihun Mamita` |
| `pack_label` | text | `1 pack isi 5 pcs` |
| `seller_whatsapp_number` | text | digits only, normalized |
| `pickup_enabled` | boolean | enable option |
| `courier_enabled` | boolean | enable option |
| `seller_delivery_enabled` | boolean | enable option |
| `price_label` | text | example: `Rp35.000 / pack` |
| `announcement_text` | text | optional note |
| `updated_at` | timestamptz | auto updated |
| `updated_by` | text | optional name from admin panel |

### Access Pattern

- `/admin` panel writes via Supabase service role key
- public page reads the row server-side only
- fallback config engages if Supabase errors or returns no row

---

## Server Integration Design

### Read Path

- Next.js server component or route handler reads the Supabase `portal_state` row via the service role key
- parse and validate values server-side
- expose normalized config to the UI

### Cache Strategy

Use short-lived cache or revalidation.

Suggested approach:

- ISR / revalidate around `60-300` seconds

Goal:

- stock updates should not lag for hours
- site should still remain stable and fast

### Failure Behavior

If the Supabase request fails or returns no row:

- default to `CLOSED`
- hide stock number
- show safe fallback copy

This is better than accidentally showing open ordering with invalid state.

---

## WhatsApp Message Spec

### Template

```text
Halo Mamita! Saya mau ikut PO Martabak Bihun:
Nama: [Name]
No. WhatsApp: [Phone]
Jumlah: [Qty] Pack
Pengiriman: [Delivery Method]
Alamat: [Address / Pickup]

Mohon info total dan rekening pembayaran ya!
```

### Delivery Label Mapping

- `pickup` -> `Pickup`
- `courier` -> `Grab/Gojek`
- `seller_delivery` -> `Diantar Seller`

### Address Mapping

- if pickup: `Pickup`
- else: actual address

### URL Format

Use WhatsApp deep link:

- `https://wa.me/<number>?text=<encodedMessage>`

or compatible alternative if needed.

### Fallback

If redirect cannot be completed:

- show the generated message
- allow copy
- keep visible seller number
- allow retry

---

## Validation Rules

### Name

- required
- trim whitespace
- reasonable max length

### WhatsApp Number

- required
- numeric-friendly input mode
- normalize spaces and dashes
- reject obviously invalid short values

### Quantity

- required
- integer only
- minimum `1`
- maximum `available_stock`

### Delivery Method

- required

### Address

- required only for non-pickup methods

---

## Technical Stack

### Recommended

- Next.js
- TypeScript
- Tailwind CSS
- Vercel deployment

### Why

- good fit for greenfield landing page
- easy Vercel deployment
- server-side config fetch is straightforward
- easy future migration to fuller backend later

---

## Delivery Plan

### Phase 1: Foundation

- initialize Next.js app
- configure Tailwind
- add banner asset handling
- implement remote config fetch layer
- define types and validation helpers

### Phase 2: Core UI

- build landing page layout
- build hero, benefits, stock badge, trust strip
- implement sticky mobile CTA
- make page match Mamita brand direction

### Phase 3: Form + WhatsApp Handoff

- build form state and validation
- implement conditional address field
- build quantity stepper
- generate WhatsApp message
- implement redirect and fallback copy flow

### Phase 4: Admin Config Integration

- connect server-side sheet fetch
- normalize config values
- implement closed / sold-out states
- implement safe fallback behavior

### Phase 5: QA + Deploy

- mobile-first pass
- test on small screens
- test WhatsApp handoff on actual phone
- verify PO open/close and stock changes
- deploy to Vercel

### Phase 6: Soft Launch

- use one real preorder batch
- observe seller workflow
- confirm message readability
- confirm stock update workflow is comfortable

---

## Test Checklist

### Functional

- landing page loads with remote config
- `OPEN` state shows form
- `CLOSED` state hides/disables form
- `SOLD_OUT` state hides/disables form
- quantity cannot exceed stock
- address appears only when needed
- WhatsApp link is correctly encoded

### Error Handling

- invalid WhatsApp number
- quantity `0`
- empty required fields
- config fetch failure
- invalid stock value from sheet
- WhatsApp redirect failure

### Mobile

- first screen shows key CTA and status
- form is usable with one hand
- tap targets are large enough
- no horizontal overflow
- sticky CTA does not block form inputs

---

## Open Questions For Later Review

These do not block the architecture, but should be confirmed before shipping:

- exact price label to show publicly
- whether seller delivery has area limitations
- whether courier orders require full address or area-only first
- whether sold-out users should still be encouraged to chat
- whether the seller wants one product only or future multi-product support

---

## Recommended Build Order

If implementation starts immediately, build in this order:

1. remote config type + mock config
2. landing page shell
3. hero + stock badge
4. order form
5. validation
6. WhatsApp generator
7. fallback copy flow
8. Supabase integration
9. sold-out / closed states
10. mobile polish and deploy

---

## Summary

The correct MVP is:

- a mobile-first Mamita preorder page
- backed by a tiny seller-editable config source
- optimized for clean WhatsApp handoff

The correct constraint is:

- do not build a real admin system or order database yet

The correct product promise is:

- easier ordering for buyers
- cleaner WhatsApp messages for Mamita
