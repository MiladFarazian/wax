import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useIG } from "@/theme/ig";

/** Redirects between the login screen and the tabs based on auth status. */
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const c = useIG();

  useEffect(() => {
    if (status === "loading") return;
    const onLogin = (segments[0] as string) === "login";
    // Cast: typed-routes typegen may lag behind a newly added route file.
    if (status === "signed_out" && !onLogin) router.replace("/login" as Href);
    if (status === "signed_in" && onLogin) router.replace("/");
  }, [status, segments, router]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.bg }}>
        <ActivityIndicator color={c.secondary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="story/[id]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
      <Stack.Screen name="new-post" options={{ presentation: "modal" }} />
      <Stack.Screen name="inbox" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <AuthGate />
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
