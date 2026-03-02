# Display Ads Campaign Builder - Ops/Managed Flow Prototype

A high-fidelity prototype demonstrating the Ops/Managed campaign creation flow for Display Ads.

## Features

- **Full Wizard Flow**: 12-step campaign creation with conditional branching
- **CPM vs CPD**: Different flows for bid-based and booked campaigns
- **Internal vs Third-Party**: Conditional fields and attribution settings
- **Calendar with Availability**: Visual booking conflicts for CPD, density forecast for CPM
- **Advanced Targeting Builder**: Multi-segment AND/OR logic with reengagement and demographic rules
- **Landing Page Builder**: Internal page generator with brands/categories/sellers
- **Creative Upload**: Platform (Mobile/Desktop) × Language (EN/AR) matrix
- **Attribution Config**: Partner IDs, brands, categories for internal campaigns
- **Review & Submit**: Full campaign summary before submission

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd display-ads-prototype
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the prototype.

## Flow Overview

| Step | Name | Condition |
|------|------|-----------|
| 0 | Campaign Config | All |
| 1 | Country & Pricing | All |
| 2 | Slot Selection | All (CPD=single, CPM=multi) |
| 3 | Schedule & Availability | All |
| 4 | Landing Page | All (Internal has builder option) |
| 5 | Creatives | All |
| 6 | Targeting | All |
| 7 | Bidding & Budget | All (CPD shows summary, CPM has inputs) |
| 8 | Frequency Cap | All (optional) |
| 9 | General Settings | All |
| 10 | Attribution | Internal only |
| 11 | Review & Submit | All |

## Mock Data

The prototype uses mock data defined in `src/lib/mock-data.ts`:

- **Countries**: UAE, KSA, Egypt
- **Pages**: Homepage, Category, Search, PDP, Cart, Checkout
- **Slots**: 8 slots with dimensions, positions, CPD rates, and daily views
- **Booked Dates**: Simulated booking conflicts for calendar
- **Brands/Categories**: Sample marketplace taxonomy
- **Partners**: Sample partner IDs for attribution
- **Targeting Options**: Reengagement and demographic rules

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context
- **Icons**: Lucide React

## Customization

### Update Mock Data

Edit `src/lib/mock-data.ts` to add/modify:
- Countries and currencies
- Pages and slots (with CPD rates)
- Booked dates
- Brands, categories, partners
- Targeting options

### Add New Steps

1. Create component in `src/components/wizard/`
2. Export from `src/components/wizard/index.ts`
3. Add to switch statement in `src/app/page.tsx`
4. Update step count in `src/context/CampaignContext.tsx`

## Production Notes

This is a **prototype for demonstration purposes**. For production:

- Replace mock data with API calls
- Add form validation with proper error handling
- Implement actual file upload for creatives
- Connect to availability/forecasting API
- Add authentication and authorization
- Implement draft auto-save
- Add analytics tracking
