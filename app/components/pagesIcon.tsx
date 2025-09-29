// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import { StyleSheet, TouchableOpacity, View } from 'react-native';

// export default function PagesIcon() {
//     const router = useRouter();
//     const icons: { name: React.ComponentProps<typeof Ionicons>['name']; screen: string }[] = [
//         { name: 'time-outline', screen: 'History' },
//         { name: 'home-outline', screen: 'Home' },
//         { name: 'receipt-outline', screen: 'sales' },
//         { name: 'settings-outline', screen: 'Settings' },
//         { name: 'person-outline', screen: 'Profile' },
//     ];

//     return (
//         <View style={styles.container}>
//             {icons.map((icon, index) => (
//                 <TouchableOpacity
//                     key={index}
//                     style={styles.iconButton}
//                     onPress={() => router.navigate(`./${icon.screen}`)}
//                 >
//                     <Ionicons name={icon.name} size={32} color="green" />
//                 </TouchableOpacity>
//             ))}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flexDirection: 'row', // horizontal layout
//         justifyContent: 'space-between', // space between icons
//         alignItems: 'center',
//         paddingHorizontal: 10, // add horizontal padding
//         paddingVertical: 20,
//     },
//     iconButton: {
//         marginHorizontal: 10, // gap between icons
//         borderWidth: 2,
//         borderColor: 'green', // green outline
//         borderRadius: 12,
//         padding: 10,
//     },
// });

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
      label: 'Analytics'
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
    return pathname.includes(screen.toLowerCase());
  };

  return (
    <View style={styles.container}>
      {icons.map((icon, index) => {
        const active = isActive(icon.screen);
        return (
          <TouchableOpacity
            key={index}
            style={[styles.iconButton, active && styles.iconButtonActive]}
            onPress={() => router.navigate(`./${icon.screen}`)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons 
                name={active ? icon.activeIcon : icon.name} 
                size={24} 
                color={active ? '#3b82f6' : '#6b7280'} 
              />
              {active && <View style={styles.activeIndicator} />}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {icon.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 64,
  },
  iconButtonActive: {
    backgroundColor: '#f0f8ff',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  labelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});