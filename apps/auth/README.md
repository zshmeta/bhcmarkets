# BHC Markets - Authentication Application

Enterprise-grade authentication frontend for the BHC Markets institutional trading platform.

## Features

### 🔐 Core Authentication
- **Sign In** - Secure email/password authentication
- **Sign Up** - New account registration with validation
- **Password Reset** - Forgot password flow with email verification
- **Session Management** - Persistent sessions with refresh tokens

### 🎨 Design & UX
- **Corporate Design** - Professional, wealth-focused aesthetic
- **Responsive Layout** - Mobile-first, works on all devices
- **Smooth Animations** - Polished transitions and micro-interactions
- **Loading States** - Skeleton screens and loading indicators
- **Password Strength** - Real-time password strength indicator

### 🛡️ Security
- **Bank-grade Encryption** - 256-bit encryption for all communications
- **Input Validation** - Client-side and server-side validation
- **Error Handling** - Comprehensive error messages without revealing sensitive info
- **CSRF Protection** - Built-in protection against cross-site attacks

### ♿ Accessibility
- **WCAG 2.1 AA** - Fully accessible interface
- **ARIA Labels** - Proper semantic HTML and ARIA attributes
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader** - Optimized for screen readers

## Technology Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Styled Components** - CSS-in-JS styling
- **Vite** - Fast build tool and dev server
- **@repo/ui** - Shared UI component library

## Getting Started

### Prerequisites
```bash
Node.js >= 18
npm >= 9
```

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Development
```bash
# Start development server
npm run dev

# Available at http://localhost:5173
```

### Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting
```bash
# Run ESLint
npm run lint
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=BHC Markets
VITE_APP_ENV=development
```

## Project Structure

```
src/
├── components/
│   ├── Forms/
│   │   ├── LoginForm.tsx          # Sign in form
│   │   ├── RegisterForm.tsx       # Sign up form
│   │   └── PasswordResetForm.tsx  # Password reset form
│   ├── AuthContext.tsx            # Authentication state management
│   ├── AuthPage.tsx               # Main authentication page
│   ├── SuccessPage.tsx            # Post-login success page
│   └── LoadingScreen.tsx          # Loading component
├── lib/
│   └── api-client.ts              # API client for backend communication
├── App.tsx                        # Root component
├── main.tsx                       # Application entry point
└── index.css                      # Global styles
```

## API Integration

The auth app communicates with the backend API using the `api-client.ts` module:

```typescript
import { createAuthClient } from './lib/api-client';

const client = createAuthClient();

// Login
await client.login({ email, password });

// Register
await client.register({ email, password });

// Password reset
await client.requestPasswordReset({ email });
```

## Theming

The app uses the corporate blue theme from `@repo/ui`:

```typescript
{
  primary: "#02173f",      // Professional navy blue
  accent: "#E6A135",       // Muted gold (wealth accent)
  background: "#0A0F1A",   // Deep corporate navy
  // ... more colors
}
```

## Best Practices

### Security
- Never store sensitive data in localStorage without encryption
- Always validate user input on both client and server
- Use HTTPS in production
- Implement rate limiting on the backend

### Performance
- Code splitting with React.lazy
- Image optimization
- Minimize bundle size
- Use production builds

### Accessibility
- Maintain proper heading hierarchy
- Provide alt text for images
- Ensure sufficient color contrast
- Support keyboard navigation

## Contributing

Please follow these guidelines:

1. Use TypeScript for all new files
2. Follow the existing code style
3. Write meaningful commit messages
4. Test on multiple browsers
5. Ensure accessibility compliance

## License

Proprietary - BHC Markets
