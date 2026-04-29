import React, { useRef, useCallback, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Animated, View, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../contexts/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ITEMS: { name: string; label: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'index',          label: 'Home',      icon: 'shield-outline',   activeIcon: 'shield'    },
  { name: 'map',            label: 'Safe Map',  icon: 'map-outline',      activeIcon: 'map'       },
  { name: 'checkin',        label: 'Check-in',  icon: 'time-outline',     activeIcon: 'time'      },
  { name: 'community',      label: 'Community', icon: 'people-outline',   activeIcon: 'people'    },
  { name: 'travel-partner', label: 'Travel',    icon: 'airplane-outline', activeIcon: 'airplane'  },
  { name: 'profile',        label: 'Profile',   icon: 'person-outline',   activeIcon: 'person'    },
];

const ANDROID_EXTRA = Platform.OS === 'android' ? 20 : 0;
const TAB_HEIGHT    = 68 + ANDROID_EXTRA;
const AUTO_HIDE_MS  = 4000; // hide after 4 seconds

// ─── Auto-hide Tab Bar Component ─────────────────────────────────────────────

function AutoHideTabBar(props: BottomTabBarProps) {
  const translateY  = useRef(new Animated.Value(TAB_HEIGHT)).current; // starts hidden
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateTo = useCallback((toValue: number, cb?: () => void) => {
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 90,
      friction: 13,
    }).start(cb);
  }, [translateY]);

  const show = useCallback(() => {
    animateTo(0); // slide in
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => animateTo(TAB_HEIGHT), AUTO_HIDE_MS);
  }, [animateTo]);

  // Show on first mount so user knows nav exists
  useEffect(() => {
    show();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Detect swipe-up gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, vy }) =>
        dy < -8 && Math.abs(vy) > 0.2,          // upward swipe
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -8) show();
      },
    })
  ).current;

  return (
    <>
      {/* Invisible swipe zone — always covers the bottom even when bar is hidden */}
      <View
        pointerEvents="box-only"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 28,
          zIndex: 997,
        }}
        {...panResponder.panHandlers}
      />

      {/* Animated tab bar */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY }],
          zIndex: 999,
        }}
        {...panResponder.panHandlers}
      >
        <BottomTabBar {...props} />
      </Animated.View>
    </>
  );
}

// ─── Tab Layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <AutoHideTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8 + ANDROID_EXTRA,
          paddingTop: 6,
          height: TAB_HEIGHT,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarActiveTintColor:   colors.primary,
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
