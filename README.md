# Display Ads Prototype

A high-fidelity interactive prototype for Display Ads booking, planning, and campaign creation workflows. Built for internal stakeholders to explore and validate the end-to-end experience before production development.

## Live Demo

Hosted on GitHub Pages: [display-ads-prototype-v1](https://melsharkawy-noon.github.io/display-ads-prototype-v1/)

## Overview

The prototype covers three main areas accessible via top-level tabs:

### Bookings

The primary entry point. Bookings are the parent commercial/planning objects that can contain multiple campaigns.

- **Bookings list** with search, filtering by status/country/advertiser type, and sortable columns
- **Expandable rows** showing child campaigns, budget allocation summary, and derived conversion status
- **Booking detail page** with editable fields, media plan input, activity log, and brand approval workflow
- **Brand approval preview** — a read-only view simulating what the brand sees, with approve/reject actions
- **Booking statuses**: Draft, Pending Brand Approval, Approved by Brand, Rejected, Planning, Partially Converted, Fully Converted
- **Derived conversion status** calculated automatically from child campaign budgets vs. booking budget
- **Activity logging** tracking creates, edits (by Sales or Ops), approvals, rejections, and campaign additions/deletions

### Calendar

A visual calendar overview showing booked time slots across pages and slots, useful for CPT availability planning.

### Campaign Builder

A single-page campaign creation flow for Managed Display and Self-Serve Display campaigns.

**Managed Display** supports:

- **Ad Types**: Banner, Interstitial, Video Popup
- **Pricing Models**: CPM (all ad types) and CPT (banner only)
- **Slot targeting** with zone-level bid multipliers (banner only)
- **Audience targeting** with compound AND/OR segment logic (re-engagement, demographic, in-market)
- **Interactive delivery forecast** — Budget and CPM Bid controls with live calculation of Expected Views, Available Views, Targeting Level, and Delivery Outlook
- **Creative uploads** with language support (English/Arabic):
  - Banner: platform × language matrix with dimension validation
  - Interstitial: multiple creatives locked to same dimensions, mobile preview with cycling
  - Video Popup: video + required thumbnail per language, preview with play state
- **Booking-linked mode** — campaigns created from a Booking carry the Booking Code and Name as read-only context, and are added as children of that Booking on submission

**Self-Serve Display** supports:

- CPM pricing only
- Audience targeting (no slot targeting)
- Standard creative uploads

## Tech Stack

- **Framework**: Next.js 14 (App Router), static export for GitHub Pages
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context (`CampaignContext`, `IntakeContext`) + local `useState`
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the prototype.

### Build (Static Export)

```bash
npm run build
```

Output is written to the `out/` directory, ready for static hosting.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page with tab navigation and top-level state
│   ├── layout.tsx            # Root layout, metadata, favicon
│   └── icon.svg              # Favicon
├── components/
│   ├── BookingsListPage.tsx   # Bookings list with expandable rows
│   ├── BookingDetailPage.tsx  # Booking detail/edit page
│   ├── BrandPreviewPage.tsx   # Brand approval preview (read-only view)
│   ├── SinglePageFlow.tsx     # Campaign builder (single-page flow)
│   ├── CalendarOverview.tsx   # Calendar view
│   ├── sections/
│   │   ├── BrandTargetingSection.tsx   # Audience + slot targeting (Managed)
│   │   ├── SellerTargetingSection.tsx  # Audience targeting (Self-Serve)
│   │   ├── BiddingSection.tsx          # Delivery forecast panel
│   │   ├── CreativesSection.tsx        # Creative uploads + preview
│   │   ├── LandingPageSection.tsx      # Landing page configuration
│   │   └── CptBookingSection.tsx       # CPT slot reservation
│   └── ui/                    # Reusable UI primitives
├── context/
│   ├── CampaignContext.tsx    # Campaign draft state
│   └── IntakeContext.tsx      # Bookings list state
└── lib/
    ├── types.ts               # Interfaces, enums, constants, mock bookings
    ├── mock-data.ts           # Mock data (countries, pages, slots, brands, etc.)
    └── utils.ts               # Formatting and helper utilities
```

## Mock Data

The prototype uses seeded mock data defined across `src/lib/types.ts` and `src/lib/mock-data.ts`:

- **Countries**: UAE, KSA, Egypt (with local currency support: AED, SAR, EGP)
- **Pages**: Homepage, Category Landing, Search, PDP, Cart, Checkout
- **Slots**: Banner slots across pages, plus fixed Interstitial Popup and Video Popup slots
- **Bookings**: 7 mock bookings in various statuses, including a "Fully Converted" example (Ramadan Electronics Push) with 3 child campaigns
- **Booking Codes**: Format `B_XXXXXXXXXXXX` (e.g., `B_KQ0NUBQG5KSG`)
- **LE Codes**: Format like `LE1CKL5STAE`
- **Brands, Categories, Sellers**: Sample marketplace taxonomy
- **Audience Segments**: Re-engagement, demographic, and in-market targeting options

## Deployment

The project deploys automatically to GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`) on push to `main`.

The `next.config.js` is configured for static export with a conditional `basePath` that activates only in production builds.

## Production Notes

This is a **prototype for demonstration and validation purposes**. For production:

- Replace mock data with API integrations
- Implement real file upload and media processing
- Connect to inventory/forecasting APIs
- Add authentication, authorization, and role-based access
- Implement persistent storage and draft auto-save
- Add proper form validation beyond prototype-level checks
