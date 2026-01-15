# Mobile - React Native App

Cross-platform mobile trading application for BHC Markets (iOS & Android).

## Overview

Native mobile app built with React Native and Expo. Provides full trading capabilities on mobile devices with optimized UI/UX for touch interfaces.

## Features

- 📱 **Native Performance** - Smooth, responsive UI
- 📊 **Mobile Charts** - Touch-optimized trading charts
- 📝 **Quick Order Entry** - Streamlined order placement
- 💼 **Portfolio Management** - Track positions on the go
- 🔔 **Push Notifications** - Real-time trade alerts
- 📈 **Price Alerts** - Set custom price notifications
- 🌓 **Dark Mode** - Optimized for low-light trading
- 🔐 **Biometric Auth** - Face ID / Touch ID support
- 📴 **Offline Mode** - View cached data offline

## Tech Stack

- **Framework**: React Native 0.76
- **Platform**: Expo 52
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State**: React Context + hooks
- **Charts**: react-native-charts-wrapper
- **Notifications**: Expo Notifications
- **Storage**: AsyncStorage
- **HTTP**: axios
- **WebSocket**: socket.io-client

## Quick Start

### Prerequisites

- Node.js 18+
- Bun (package manager)
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ (for iOS simulator)
- Android: Android Studio (for Android emulator)

### Development

```bash
# From monorepo root
bun run dev:mobile

# Or from this directory
bun run start
```

Then choose:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

### Running on Device

1. **Install Expo Go** on your device:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR code** displayed in terminal

3. **App loads** on your device

## Environment Variables

Create `.env` in the app directory:

```bash
# API endpoints
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_MARKET_DATA_WS=ws://localhost:6060/ws
EXPO_PUBLIC_ORDER_ENGINE_WS=ws://localhost:4040/ws

# OneSignal (push notifications)
EXPO_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
```

## Project Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx          # Main dashboard
│   ├── MarketScreen.tsx        # Market overview
│   ├── TradeScreen.tsx         # Trading interface
│   ├── PortfolioScreen.tsx     # Portfolio view
│   ├── OrdersScreen.tsx        # Orders history
│   ├── SettingsScreen.tsx      # App settings
│   └── AuthScreens/            # Login/Register
├── components/
│   ├── Chart/                  # Trading chart
│   ├── OrderForm/              # Order entry
│   ├── PositionCard/           # Position display
│   ├── PriceCard/              # Price ticker
│   ├── OrderCard/              # Order display
│   └── common/                 # Reusable components
├── navigation/
│   ├── AppNavigator.tsx        # Main navigation
│   ├── TabNavigator.tsx        # Bottom tabs
│   └── AuthNavigator.tsx       # Auth flow
├── hooks/
│   ├── useAuth.ts              # Authentication
│   ├── useMarketData.ts        # Market data
│   ├── useOrders.ts            # Order management
│   ├── usePositions.ts         # Position tracking
│   └── usePushNotifications.ts # Push notifications
├── services/
│   ├── api.ts                  # API client
│   ├── websocket.ts            # WebSocket manager
│   ├── auth.ts                 # Auth service
│   ├── storage.ts              # AsyncStorage utilities
│   └── notifications.ts        # Push notification service
├── contexts/
│   ├── AuthContext.tsx         # Auth state
│   ├── MarketContext.tsx       # Market data state
│   └── ThemeContext.tsx        # Theme state
├── utils/
│   ├── formatting.ts           # Number/date formatting
│   ├── validation.ts           # Input validation
│   └── constants.ts            # App constants
├── types/
│   └── index.ts                # TypeScript types
└── App.tsx                     # Root component
```

## Navigation

### Bottom Tab Navigator

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Trade" component={TradeScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
```

## Key Features

### Real-Time Market Data

```typescript
import { useMarketData } from '../hooks/useMarketData';

function MarketScreen() {
  const { prices, subscribe, unsubscribe } = useMarketData();

  useEffect(() => {
    subscribe(['BTC/USD', 'ETH/USD', 'SOL/USD']);
    return () => unsubscribe(['BTC/USD', 'ETH/USD', 'SOL/USD']);
  }, []);

  return (
    <FlatList
      data={Object.values(prices)}
      renderItem={({ item }) => <PriceCard price={item} />}
    />
  );
}
```

### Order Placement

```typescript
import { useOrders } from '../hooks/useOrders';

function TradeScreen() {
  const { placeOrder, loading } = useOrders();

  const handlePlaceOrder = async () => {
    await placeOrder({
      symbol: 'BTC/USD',
      side: 'buy',
      type: 'limit',
      quantity: 0.1,
      price: 50000,
    });
  };

  return (
    <OrderForm onSubmit={handlePlaceOrder} loading={loading} />
  );
}
```

### Portfolio Tracking

```typescript
import { usePositions } from '../hooks/usePositions';

function PortfolioScreen() {
  const { positions, totalValue, totalPnL } = usePositions();

  return (
    <View>
      <PortfolioSummary value={totalValue} pnl={totalPnL} />
      <FlatList
        data={positions}
        renderItem={({ item }) => <PositionCard position={item} />}
      />
    </View>
  );
}
```

### Push Notifications

```typescript
import { usePushNotifications } from '../hooks/usePushNotifications';

function App() {
  const { registerForPushNotifications, onNotification } = usePushNotifications();

  useEffect(() => {
    registerForPushNotifications();

    const subscription = onNotification((notification) => {
      console.log('Received notification:', notification);

      if (notification.data?.type === 'trade_filled') {
        // Navigate to order details
        navigation.navigate('OrderDetails', { id: notification.data.orderId });
      }
    });

    return () => subscription.remove();
  }, []);

  return <AppNavigator />;
}
```

### Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access BHC Markets',
    });

    if (result.success) {
      // Authentication successful
      return true;
    }
  }

  return false;
}
```

### Price Alerts

```typescript
import { usePriceAlerts } from '../hooks/usePriceAlerts';

function PriceAlertsScreen() {
  const { alerts, createAlert, deleteAlert } = usePriceAlerts();

  const handleCreateAlert = async () => {
    await createAlert({
      symbol: 'BTC/USD',
      condition: 'above',
      price: 60000,
    });
  };

  return (
    <FlatList
      data={alerts}
      renderItem={({ item }) => (
        <AlertCard alert={item} onDelete={() => deleteAlert(item.id)} />
      )}
    />
  );
}
```

## Offline Support

Cache data for offline viewing:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache market data
await AsyncStorage.setItem('market_data', JSON.stringify(prices));

// Retrieve cached data
const cached = await AsyncStorage.getItem('market_data');
const prices = cached ? JSON.parse(cached) : {};
```

## Deep Linking

Handle deep links from notifications:

```typescript
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'bhcmarkets://'],
  config: {
    screens: {
      Trade: 'trade/:symbol',
      OrderDetails: 'orders/:id',
      PositionDetails: 'positions/:id',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

## Building

### Development Build

```bash
# iOS
bun run ios

# Android
bun run android
```

### Production Build

```bash
# Configure app.json first
# Then build:

# iOS
eas build --platform ios

# Android
eas build --platform android
```

### Publishing Updates

```bash
# Publish OTA update
eas update --branch production
```

## App Configuration

Edit `app.json`:

```json
{
  "expo": {
    "name": "BHC Markets",
    "slug": "bhc-markets",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0e27"
    },
    "ios": {
      "bundleIdentifier": "com.bhcmarkets.app",
      "supportsTablet": true,
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID to securely access your account"
      }
    },
    "android": {
      "package": "com.bhcmarkets.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0e27"
      },
      "permissions": [
        "USE_BIOMETRIC",
        "NOTIFICATIONS"
      ]
    },
    "notification": {
      "icon": "./assets/notification-icon.png"
    }
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

## Performance

- **Code splitting**: Lazy load screens
- **Image optimization**: Use WebP format
- **List virtualization**: FlatList for long lists
- **Memoization**: React.memo for expensive components
- **Throttling**: Throttle real-time updates

## Debugging

```bash
# Open React DevTools
npm install -g react-devtools
react-devtools

# View logs
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

## Platform-Specific Code

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // iOS status bar
  },
});

// Or use Platform.select
const fontSize = Platform.select({
  ios: 16,
  android: 14,
});
```

## App Store Deployment

### iOS

1. Configure app in App Store Connect
2. Build with `eas build --platform ios`
3. Submit with `eas submit --platform ios`

### Android

1. Configure app in Google Play Console
2. Build with `eas build --platform android`
3. Submit with `eas submit --platform android`

## License

Private - BHC Markets
