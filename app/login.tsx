import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IGLoginWebView } from "@/components/IGLoginWebView";
import { useAuth } from "@/lib/AuthContext";
import { completeLogin } from "@/lib/auth";
import { useTheme } from "@/theme/useTheme";
import { radius, spacing, type } from "@/theme/tokens";

/**
 * Login — the Wax-branded shell around Instagram's own login webview.
 * Brand lives here at the edge (docs/SPRINT.md §4); the actual credential entry
 * happens on Instagram's page. We surface the account-risk disclosure up front
 * (Sprint §1) before the user connects.
 */
export default function Login() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { setStatus } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToken(token: string) {
    const status = await completeLogin(token);
    if (status === "signed_in") setStatus("signed_in");
    else {
      setError("Couldn't verify that session. Please try connecting again.");
      setConnecting(false);
    }
  }

  if (connecting) {
    return <IGLoginWebView onToken={onToken} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.hero}>
        <Text style={[type.display, { color: c.text }]}>Wax</Text>
        <Text style={[type.body, { color: c.muted, marginTop: spacing.xs }]}>
          Silence the noise. Keep the connection.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[type.title, { color: c.text }]}>Connect your Instagram</Text>
        <Text style={[type.body, { color: c.muted, marginTop: spacing.sm }]}>
          You'll sign in on Instagram's own page. Wax never sees your password — only a
          session it stores securely on this device.
        </Text>

        <Text style={[type.caption, { color: c.muted, marginTop: spacing.lg }]}>
          Wax is not affiliated with Instagram or Meta. Using a third-party client is against
          Instagram's terms and could put your account at risk. Connect at your own discretion.
        </Text>

        {error ? (
          <Text style={[type.caption, { color: c.danger, marginTop: spacing.md }]}>{error}</Text>
        ) : null}

        <Pressable
          style={[styles.button, { backgroundColor: c.accent }]}
          onPress={() => {
            setError(null);
            setConnecting(true);
          }}
        >
          <Text style={[type.label, { color: "#1A1814" }]}>Connect Instagram</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  hero: { alignItems: "center", marginBottom: spacing.xxl },
  card: { borderRadius: radius.lg, padding: spacing.lg },
  button: {
    marginTop: spacing.xl,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
