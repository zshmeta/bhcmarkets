# @repo/ui

Shared design system and UI components for BHC Markets.

## Overview

A foundational UI component library providing reusable, accessible, and consistent components across all BHC Markets applications. Built with React, TypeScript, and styled-components.

## Features

- 🎨 **Design System** - Consistent colors, typography, spacing
- 🧩 **Reusable Components** - Buttons, inputs, modals, cards, etc.
- ♿ **Accessible** - WCAG 2.1 Level AA compliant
- 🎭 **Themeable** - Dark mode support
- 📱 **Responsive** - Mobile-first design
- 🔤 **TypeScript** - Full type safety
- 💅 **Styled Components** - CSS-in-JS styling

## Installation

```bash
# Already included in the monorepo
bun install
```

## Components

### Button

```tsx
import { Button } from '@repo/ui';

function Example() {
  return (
    <>
      <Button variant="primary" onClick={() => alert('Clicked!')}>
        Primary Button
      </Button>
      
      <Button variant="secondary" disabled>
        Disabled Button
      </Button>
      
      <Button variant="danger" size="small">
        Delete
      </Button>
    </>
  );
}
```

**Props:**
- `variant`: "primary" | "secondary" | "success" | "danger" | "ghost" (default: "primary")
- `size`: "small" | "medium" | "large" (default: "medium")
- `disabled`: boolean
- `fullWidth`: boolean
- `loading`: boolean (shows spinner)
- `icon`: React node (prepends icon)

### Input

```tsx
import { Input } from '@repo/ui';

function Example() {
  const [value, setValue] = useState('');

  return (
    <Input
      type="text"
      placeholder="Enter email"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      error="Invalid email"
    />
  );
}
```

**Props:**
- `type`: "text" | "email" | "password" | "number"
- `placeholder`: string
- `value`: string
- `onChange`: (e: ChangeEvent) => void
- `error`: string (shows error message)
- `disabled`: boolean
- `fullWidth`: boolean
- `icon`: React node (prepends icon)

### Card

```tsx
import { Card } from '@repo/ui';

function Example() {
  return (
    <Card>
      <Card.Header>
        <h2>Card Title</h2>
      </Card.Header>
      <Card.Body>
        <p>Card content goes here.</p>
      </Card.Body>
      <Card.Footer>
        <Button>Action</Button>
      </Card.Footer>
    </Card>
  );
}
```

**Props:**
- `padding`: "none" | "small" | "medium" | "large" (default: "medium")
- `elevated`: boolean (adds shadow)
- `bordered`: boolean

### Modal

```tsx
import { Modal } from '@repo/ui';

function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
      >
        <p>Are you sure you want to proceed?</p>
        <Button onClick={() => setIsOpen(false)}>Confirm</Button>
      </Modal>
    </>
  );
}
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: "small" | "medium" | "large" (default: "medium")
- `closeOnOverlayClick`: boolean (default: true)
- `showCloseButton`: boolean (default: true)

### Table

```tsx
import { Table } from '@repo/ui';

function Example() {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  const data = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      onRowClick={(row) => console.log('Clicked:', row)}
    />
  );
}
```

**Props:**
- `columns`: Array of column definitions
- `data`: Array of row data
- `onRowClick`: (row: any) => void
- `striped`: boolean (alternating row colors)
- `hoverable`: boolean (highlight on hover)
- `compact`: boolean (reduced padding)

### Spinner

```tsx
import { Spinner } from '@repo/ui';

function Example() {
  return <Spinner size="large" />;
}
```

**Props:**
- `size`: "small" | "medium" | "large" (default: "medium")
- `color`: string (default: theme primary color)

### Tooltip

```tsx
import { Tooltip } from '@repo/ui';

function Example() {
  return (
    <Tooltip content="This is a helpful tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  );
}
```

**Props:**
- `content`: string | React node
- `placement`: "top" | "right" | "bottom" | "left" (default: "top")
- `delay`: number (ms, default: 200)

### Alert

```tsx
import { Alert } from '@repo/ui';

function Example() {
  return (
    <>
      <Alert variant="success">Successfully saved!</Alert>
      <Alert variant="error" dismissible onDismiss={() => console.log('Dismissed')}>
        An error occurred.
      </Alert>
      <Alert variant="warning">Warning message.</Alert>
      <Alert variant="info">Informational message.</Alert>
    </>
  );
}
```

**Props:**
- `variant`: "success" | "error" | "warning" | "info" (default: "info")
- `dismissible`: boolean
- `onDismiss`: () => void

### Badge

```tsx
import { Badge } from '@repo/ui';

function Example() {
  return (
    <>
      <Badge variant="success">Active</Badge>
      <Badge variant="danger">Suspended</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="info">New</Badge>
    </>
  );
}
```

**Props:**
- `variant`: "success" | "danger" | "warning" | "info" | "neutral" (default: "neutral")
- `size`: "small" | "medium" | "large" (default: "medium")

### Tabs

```tsx
import { Tabs } from '@repo/ui';

function Example() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
        <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
      </Tabs.List>
      
      <Tabs.Panel value="tab1">
        Content for Tab 1
      </Tabs.Panel>
      <Tabs.Panel value="tab2">
        Content for Tab 2
      </Tabs.Panel>
      <Tabs.Panel value="tab3">
        Content for Tab 3
      </Tabs.Panel>
    </Tabs>
  );
}
```

### Select

```tsx
import { Select } from '@repo/ui';

function Example() {
  const [value, setValue] = useState('');

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <Select
      options={options}
      value={value}
      onChange={setValue}
      placeholder="Select an option"
    />
  );
}
```

### Checkbox

```tsx
import { Checkbox } from '@repo/ui';

function Example() {
  const [checked, setChecked] = useState(false);

  return (
    <Checkbox
      checked={checked}
      onChange={setChecked}
      label="I agree to the terms and conditions"
    />
  );
}
```

## Theme

### Using the Theme

```tsx
import { ThemeProvider } from 'styled-components';
import { theme } from '@repo/ui';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### Theme Structure

```typescript
const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      500: '#2196f3',  // Main
      700: '#1976d2',
      900: '#0d47a1',
    },
    
    // Grayscale
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      500: '#9e9e9e',
      700: '#616161',
      900: '#212121',
    },
    
    // Semantic colors
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    
    // Backgrounds
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#eeeeee',
    },
    
    // Text
    text: {
      primary: '#212121',
      secondary: '#616161',
      tertiary: '#9e9e9e',
    },
    
    // Borders
    border: {
      primary: '#e0e0e0',
      secondary: '#eeeeee',
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
};
```

### Accessing Theme in Components

```tsx
import styled from 'styled-components';

const StyledButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSize.md};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
  }
`;
```

### Dark Mode

```tsx
import { ThemeProvider } from 'styled-components';
import { theme, darkTheme } from '@repo/ui';

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeProvider theme={isDark ? darkTheme : theme}>
      <Button onClick={() => setIsDark(!isDark)}>
        Toggle Theme
      </Button>
    </ThemeProvider>
  );
}
```

## Layout Components

### Container

```tsx
import { Container } from '@repo/ui';

function Example() {
  return (
    <Container maxWidth="desktop">
      <p>Centered content with max width</p>
    </Container>
  );
}
```

### Grid

```tsx
import { Grid } from '@repo/ui';

function Example() {
  return (
    <Grid columns={3} gap="md">
      <div>Column 1</div>
      <div>Column 2</div>
      <div>Column 3</div>
    </Grid>
  );
}
```

### Stack

```tsx
import { Stack } from '@repo/ui';

function Example() {
  return (
    <Stack direction="vertical" spacing="md">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </Stack>
  );
}
```

## Utilities

### useMediaQuery

```tsx
import { useMediaQuery } from '@repo/ui/hooks';

function Example() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}
```

### useTheme

```tsx
import { useTheme } from '@repo/ui/hooks';

function Example() {
  const theme = useTheme();

  return <div style={{ color: theme.colors.primary[500] }}>Themed text</div>;
}
```

## TypeScript Support

All components are fully typed with TypeScript:

```typescript
import type { ButtonProps, InputProps, ModalProps } from '@repo/ui';

const button: ButtonProps = {
  variant: 'primary',
  size: 'large',
  onClick: () => console.log('Clicked'),
};
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- Semantic HTML elements
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast ratios

## Best Practices

1. **Always use theme values** - Don't hardcode colors, spacing, etc.
2. **Prefer semantic color names** - Use `success`, `error`, `warning` instead of specific colors
3. **Use TypeScript** - Take advantage of type safety
4. **Test accessibility** - Use keyboard navigation and screen readers
5. **Keep components simple** - Compose complex UIs from simple components
6. **Follow naming conventions** - Use descriptive prop names

## License

Private - BHC Markets
