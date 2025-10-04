// import { Stack } from 'expo-router';
// import { StatusBar } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function Layout() {
//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor={"black"} />
//       <SafeAreaView style={{ flex: 1 }}>
//         <Stack>
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         </Stack>
//       </SafeAreaView>
//     </>
//   );
// }

// import { Stack } from "expo-router";
// import { useState } from "react";
// import { ActivityIndicator, StatusBar, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function RootLayout() {
//   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

//   // useEffect(() => {
//   //   const checkLoginStatus = async () => {
//   //     try {
//   //       const token = await SecureStore.getItemAsync("authToken");
//   //       setIsLoggedIn(!!token);
//   //     } catch (error) {
//   //       console.error("Error reading token:", error);
//   //       setIsLoggedIn(false);
//   //     }
//   //   };
//   //   checkLoginStatus();
//   // }, []);

//   // Show loading spinner while checking token
//   if (isLoggedIn === null) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="blue" />
//       </View>
//     );
//   }

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="black" />
//       <SafeAreaView style={{ flex: 1 }}>
//         <Stack screenOptions={{ headerShown: false }}>
//           {isLoggedIn ? (
//             <Stack.Screen name="(tabs)" />
//           ) : (
//             <Stack.Screen name="(auth)" />
//           )}
//         </Stack>
//       </SafeAreaView>
//     </>
//   );
// }

import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<null | boolean>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      setIsLoggedIn(!!token);
    };
    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
