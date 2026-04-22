import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ITEMS: { name: string; label: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'index', label: 'Home', icon: 'shield-outline', activeIcon: 'shield' },
  { name: 'map', label: 'Safe Map', icon: 'map-outline', activeIcon: 'map' },
  { name: 'checkin', label: 'Check-in', icon: 'time-outline', activeIcon: 'time' },
  { name: 'community', label: 'Community', icon: 'people-outline', activeIcon: 'people' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

// Android's 3-button nav bar or gesture nav needs extra bottom padding
const ANDROID_NAV_PADDING = Platform.OS === 'android' ? 20 : 0;

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8 + ANDROID_NAV_PADDING,
          paddingTop: 6,
          height: 68 + ANDROID_NAV_PADDING,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
