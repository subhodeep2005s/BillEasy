import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IconItem = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  screen: string;
  label: string;
};

export default function PagesIcon() {
  const router = useRouter();
  const pathname = usePathname();

  const icons: IconItem[] = [
    { 
      name: 'time-outline', 
      activeIcon: 'time',
      screen: 'History',
      label: 'History'
    },
    { 
      name: 'home-outline', 
      activeIcon: 'home',
      screen: 'Home',
      label: 'Home'
    },
    { 
      name: 'stats-chart-outline', 
      activeIcon: 'stats-chart',
      screen: 'sales',
      label: 'Sales'
    },
    { 
      name: 'settings-outline', 
      activeIcon: 'settings',
      screen: 'Settings',
      label: 'Settings'
    },
    { 
      name: 'person-outline', 
      activeIcon: 'person',
      screen: 'Profile',
      label: 'Profile'
    },
  ];

  const isActive = (screen: string) => {
    const normalizedPath = pathname.toLowerCase();
    const normalizedScreen = screen.toLowerCase();
    
    // Check if it's the home screen (root or /index)
    if (normalizedScreen === 'home') {
      return normalizedPath === '/' || normalizedPath === '/index';
    }
    
    return normalizedPath.includes(normalizedScreen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {icons.map((icon, index) => {
          const active = isActive(icon.screen);
          return (
            <TouchableOpacity
              key={index}
              style={styles.iconButton}
              onPress={() => router.navigate(`./${icon.screen}`)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                <Ionicons 
                  name={active ? icon.activeIcon : icon.name} 
                  size={20} 
                  color={active ? '#3b82f6' : '#6b7280'} 
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>
                {icon.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: '#eff6ff',
  },
  label: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  labelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});