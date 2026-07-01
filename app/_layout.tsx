import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { palette } from "@/theme/tokens";

/** Redirects between the login screen and the tabs based on auth status. */
function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const onLogin = (segments[0] as string) === "login";
    // Cast: typed-routes typegen may lag behind a newly added route file.
    if (status === "signed_out" && !onLogin) router.replace("/login" as Href);
    if (status === "signed_in" && onLogin) router.replace("/");
  }, [status, segments, router]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.waxCream }}>
        <ActivityIndicator color={palette.honey} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
