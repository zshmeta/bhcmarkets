# Web - Marketing & Landing Site

Marketing website and landing page for BHC Markets.

## Overview

The public-facing website for BHC Markets. Showcases platform features, provides information for potential users, and drives user registration.

## Features

- 🏠 **Landing Page** - Eye-catching hero section with CTA
- ✨ **Features Section** - Platform capabilities and benefits
- 💼 **Asset Classes** - Crypto, forex, stocks, commodities
- 📊 **Pricing** - Transparent fee structure
- 🎓 **Education** - Trading guides and resources
- 📱 **Responsive** - Mobile-first design
- ⚡ **Fast** - Optimized for performance
- 🔍 **SEO Optimized** - Meta tags, sitemaps, structured data

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: styled-components
- **Routing**: react-router-dom
- **Animations**: Framer Motion (optional)
- **Forms**: Custom contact forms

## Quick Start

### Development

```bash
# From monorepo root
bun run dev:web

# Or from this directory
bun run dev
```

App runs at http://localhost:5176

### Production Build

```bash
bun run build
bun run preview
```

## Environment Variables

Create `.env` in the app directory:

```bash
# Auth portal URL
VITE_AUTH_URL=http://localhost:5173

# Platform URL
VITE_PLATFORM_URL=http://localhost:5174

# Contact form endpoint
VITE_CONTACT_API=http://localhost:8080/api/contact
```

## Project Structure

```
src/
├── components/
│   ├── Hero/               # Hero section
│   ├── Features/           # Features grid
│   ├── AssetClasses/       # Asset classes showcase
│   ├── Pricing/            # Pricing tables
│   ├── Testimonials/       # Customer testimonials
│   ├── FAQ/                # Frequently asked questions
│   ├── ContactForm/        # Contact form
│   ├── Footer/             # Site footer
│   └── Header/             # Site header
├── pages/
│   ├── Home/               # Landing page
│   ├── About/              # About us
│   ├── Features/           # Features page
│   ├── Pricing/            # Pricing page
│   ├── Education/          # Educational content
│   ├── Contact/            # Contact page
│   └── Legal/              # Terms, Privacy Policy
├── hooks/
│   └── useContact.ts       # Contact form submission
├── utils/
│   ├── analytics.ts        # Analytics tracking
│   └── seo.ts              # SEO utilities
├── types/
│   └── index.ts            # TypeScript types
├── App.tsx                 # App component
├── main.tsx                # Entry point
└── router.tsx              # Route definitions
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page |
| `/about` | About | About BHC Markets |
| `/features` | Features | Platform features |
| `/pricing` | Pricing | Fee structure |
| `/education` | Education | Trading guides |
| `/contact` | Contact | Contact form |
| `/terms` | Terms | Terms of service |
| `/privacy` | Privacy | Privacy policy |

## Key Sections

### Hero Section

Eye-catching hero with call-to-action:

```tsx
<Hero
  title="Trade Crypto, Forex, Stocks & Commodities"
  subtitle="Professional trading platform with real-time data and advanced tools"
  ctaText="Start Trading"
  ctaLink={`${AUTH_URL}/register`}
  backgroundImage="/hero-bg.jpg"
/>
```

### Features

Grid of platform features:

```tsx
const features = [
  {
    icon: <ChartIcon />,
    title: 'Advanced Charts',
    description: 'TradingView-style charts with 100+ indicators',
  },
  {
    icon: <LightningIcon />,
    title: 'Fast Execution',
    description: 'Sub-millisecond order matching engine',
  },
  // ...
];

<Features features={features} />
```

### Asset Classes

Showcase tradable assets:

```tsx
const assetClasses = [
  {
    name: 'Cryptocurrencies',
    description: 'BTC, ETH, SOL, and 10+ major cryptocurrencies',
    image: '/crypto.jpg',
  },
  {
    name: 'Forex',
    description: 'Major and minor currency pairs with tight spreads',
    image: '/forex.jpg',
  },
  // ...
];

<AssetClasses classes={assetClasses} />
```

### Pricing

Transparent fee structure:

```tsx
<Pricing
  tiers={[
    {
      name: 'Starter',
      volume: '< $100k/month',
      makerFee: '0.15%',
      takerFee: '0.25%',
    },
    {
      name: 'Professional',
      volume: '$100k - $1M/month',
      makerFee: '0.10%',
      takerFee: '0.20%',
    },
    // ...
  ]}
/>
```

### Contact Form

Contact form with validation:

```tsx
import { useContact } from '../hooks/useContact';

function ContactPage() {
  const { submitContact, loading, success } = useContact();

  const handleSubmit = async (data) => {
    await submitContact({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
  };

  return (
    <ContactForm
      onSubmit={handleSubmit}
      loading={loading}
      success={success}
    />
  );
}
```

## SEO Optimization

### Meta Tags

Each page includes meta tags:

```tsx
import { Helmet } from 'react-helmet-async';

function HomePage() {
  return (
    <>
      <Helmet>
        <title>BHC Markets - Professional Trading Platform</title>
        <meta
          name="description"
          content="Trade crypto, forex, stocks, and commodities with advanced tools and real-time data."
        />
        <meta
          name="keywords"
          content="trading, crypto, forex, stocks, bitcoin, ethereum"
        />
        <meta property="og:title" content="BHC Markets" />
        <meta property="og:description" content="Professional trading platform" />
        <meta property="og:image" content="/og-image.jpg" />
      </Helmet>
      {/* Page content */}
    </>
  );
}
```

### Sitemap

Generate sitemap for search engines:

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bhcmarkets.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bhcmarkets.com/features</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... -->
</urlset>
```

### Structured Data

Add JSON-LD for rich snippets:

```tsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "BHC Markets",
    "description": "Professional trading platform",
    "url": "https://bhcmarkets.com",
    "logo": "https://bhcmarkets.com/logo.png",
  })}
</script>
```

## Analytics

Track user interactions:

```typescript
import { trackEvent } from '../utils/analytics';

// Track CTA clicks
const handleCTAClick = () => {
  trackEvent('CTA Click', {
    location: 'hero',
    destination: '/register',
  });
  
  window.location.href = `${AUTH_URL}/register`;
};

// Track page views
useEffect(() => {
  trackPageView(window.location.pathname);
}, [location]);
```

## Performance

- **Code Splitting**: Routes are lazy loaded
- **Image Optimization**: WebP format with fallbacks
- **Asset Compression**: Gzip/Brotli compression
- **CDN**: Serve static assets from CDN
- **Lazy Loading**: Images lazy load below the fold

## Responsive Design

Mobile-first design with breakpoints:

```typescript
const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
};

const StyledSection = styled.section`
  padding: 2rem;

  @media (min-width: ${breakpoints.tablet}) {
    padding: 4rem;
  }

  @media (min-width: ${breakpoints.desktop}) {
    padding: 6rem;
  }
`;
```

## Forms

Contact form with validation:

```tsx
import { useForm } from '../hooks/useForm';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

function ContactForm() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    validationSchema: contactSchema,
    onSubmit: async (values) => {
      await submitContact(values);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <Input name="name" value={values.name} onChange={handleChange} error={errors.name} />
      <Input name="email" value={values.email} onChange={handleChange} error={errors.email} />
      <Input name="subject" value={values.subject} onChange={handleChange} error={errors.subject} />
      <Textarea name="message" value={values.message} onChange={handleChange} error={errors.message} />
      <Button type="submit">Send Message</Button>
    </form>
  );
}
```

## Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test:watch

# Type check
bun run typecheck

# Lint
bun run lint
```

## Building for Production

```bash
# Build optimized bundle
bun run build

# Preview production build
bun run preview
```

Build output goes to `dist/` directory.

## Deployment

Deploy to:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Cloudflare Pages**: `wrangler pages publish dist`

### Environment Variables (Production)

```bash
VITE_AUTH_URL=https://auth.bhcmarkets.com
VITE_PLATFORM_URL=https://platform.bhcmarkets.com
VITE_CONTACT_API=https://api.bhcmarkets.com/api/contact
```

## Content Management

Update content in:

- `src/data/features.ts` - Features list
- `src/data/assets.ts` - Asset classes
- `src/data/pricing.ts` - Pricing tiers
- `src/data/faq.ts` - FAQ items

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- WCAG 2.1 Level AA compliant
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Alt text on images
- Focus indicators

## License

Private - BHC Markets
