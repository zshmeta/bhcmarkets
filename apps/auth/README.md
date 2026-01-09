# Auth - Authentication Portal

Authentication and user management portal for BHC Markets.

## Overview

A dedicated authentication application handling user registration, login, password reset, and session management. Built with React and Vite, it provides a secure and user-friendly authentication experience.

## Features

- 🔐 **User Login** - Email/password authentication with JWT
- 📝 **User Registration** - Create new user accounts
- 🔑 **Password Reset** - Forgot password flow with email
- 🔄 **Token Refresh** - Automatic access token refresh
- 🎫 **Auth Code Exchange** - Cross-domain authentication
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Clean UI** - Modern, accessible interface
- 🔒 **Secure** - HTTPS, CSRF protection, secure cookies

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: styled-components
- **Routing**: react-router-dom
- **Form Handling**: Custom hooks
- **Validation**: Zod
- **HTTP Client**: fetch API

## Quick Start

### Development

```bash
# From monorepo root
bun run dev:auth

# Or from this directory
bun run dev
```

App runs at http://localhost:5173

### Production Build

```bash
bun run build
bun run preview
```

## Environment Variables

Create `.env` in the app directory:

```bash
# Backend API
VITE_API_URL=http://localhost:8080

# Platform redirect URL (after successful auth)
VITE_PLATFORM_URL=http://localhost:5174

# Optional: Feature flags
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_SOCIAL_LOGIN=false
```

## Project Structure

```
src/
├── components/
│   ├── LoginForm/          # Login form component
│   ├── RegisterForm/       # Registration form
│   ├── PasswordResetForm/  # Password reset form
│   ├── Input/              # Form input component
│   ├── Button/             # Button component
│   └── Layout/             # Page layouts
├── pages/
│   ├── Login/              # Login page
│   ├── Register/           # Registration page
│   ├── ForgotPassword/     # Forgot password page
│   ├── ResetPassword/      # Reset password page
│   └── Callback/           # OAuth callback page
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   ├── useForm.ts          # Form handling hook
│   └── useValidation.ts    # Form validation hook
├── services/
│   ├── api.ts              # API client
│   └── auth.ts             # Auth service
├── utils/
│   ├── validation.ts       # Validation schemas
│   ├── storage.ts          # Local storage utilities
│   └── constants.ts        # App constants
├── types/
│   └── index.ts            # TypeScript types
├── App.tsx                 # App component
├── main.tsx                # Entry point
└── router.tsx              # Route definitions
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | Login | User login page |
| `/register` | Register | User registration page |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/reset-password` | ResetPassword | Password reset form |
| `/callback` | Callback | OAuth/auth code callback |

## Authentication Flow

### Login Flow

```
1. User enters email/password
2. App sends POST /auth/login to backend
3. Backend validates credentials
4. Backend returns access token + refresh token
5. App stores tokens in localStorage
6. App redirects to platform with auth code
7. Platform exchanges auth code for tokens
```

### Registration Flow

```
1. User fills registration form
2. App validates inputs (email, password strength)
3. App sends POST /auth/register to backend
4. Backend creates user account
5. Backend sends verification email (optional)
6. App shows success message
7. User can log in
```

### Password Reset Flow

```
1. User enters email on forgot-password page
2. App sends POST /auth/forgot-password
3. Backend generates reset token
4. Backend sends reset email with link
5. User clicks link → /reset-password?token=xyz
6. User enters new password
7. App sends POST /auth/reset-password
8. Backend validates token and updates password
9. User can log in with new password
```

### Cross-Domain Authentication

For secure authentication across auth and platform apps:

```
1. User logs in at auth portal
2. Auth portal generates auth code
3. Auth portal redirects to platform with code
   → http://localhost:5174/callback?code=abc123
4. Platform exchanges code for tokens
   → POST /auth/exchange { code: 'abc123' }
5. Backend validates code and returns tokens
6. Platform stores tokens and loads user data
```

## API Integration

### Login

```typescript
import { login } from '../services/auth';

const handleLogin = async (email: string, password: string) => {
  try {
    const { accessToken, refreshToken, user } = await login(email, password);
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Redirect to platform
    window.location.href = `${PLATFORM_URL}/callback?code=${authCode}`;
  } catch (error) {
    console.error('Login failed:', error);
    alert('Invalid credentials');
  }
};
```

### Register

```typescript
import { register } from '../services/auth';

const handleRegister = async (data: RegisterData) => {
  try {
    await register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    
    alert('Registration successful! Please check your email.');
    navigate('/login');
  } catch (error) {
    console.error('Registration failed:', error);
    alert(error.message);
  }
};
```

## Form Validation

Forms are validated with Zod schemas:

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

## Custom Hooks

### useAuth

```typescript
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    await login(email, password);
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}
```

### useForm

```typescript
import { useForm } from '../hooks/useForm';

function RegisterForm() {
  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      await register(values);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />
      {/* ... */}
    </form>
  );
}
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special character

### Token Storage

- Access token: localStorage (short-lived, 15 min)
- Refresh token: localStorage (long-lived, 30 days)
- Tokens are cleared on logout

### CSRF Protection

- CSRF tokens for state-changing operations
- SameSite cookie attribute
- Origin validation

## UI Components

### LoginForm

```tsx
<LoginForm
  onSubmit={(email, password) => handleLogin(email, password)}
  loading={loading}
  error={error}
  onForgotPassword={() => navigate('/forgot-password')}
  onRegister={() => navigate('/register')}
/>
```

### RegisterForm

```tsx
<RegisterForm
  onSubmit={(data) => handleRegister(data)}
  loading={loading}
  error={error}
  onLogin={() => navigate('/login')}
/>
```

### PasswordResetForm

```tsx
<PasswordResetForm
  token={tokenFromUrl}
  onSubmit={(newPassword) => handleResetPassword(token, newPassword)}
  loading={loading}
  error={error}
/>
```

## Error Handling

Errors are displayed inline and as toast notifications:

```typescript
try {
  await login(email, password);
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    setError('Invalid email or password');
  } else if (error.code === 'ACCOUNT_SUSPENDED') {
    setError('Your account has been suspended');
  } else {
    setError('An unexpected error occurred');
  }
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

Deploy as a static site to:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Cloudflare Pages**: `wrangler pages publish dist`

### Environment Variables (Production)

Set in your deployment platform:

```bash
VITE_API_URL=https://api.bhcmarkets.com
VITE_PLATFORM_URL=https://platform.bhcmarkets.com
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation
- Screen reader support
- Focus indicators
- Semantic HTML

## License

Private - BHC Markets
