import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IGLoginWebView } from "@/components/IGLoginWebView";
import { useAuth } from "@/lib/AuthContext";
import { completeLogin } from "@/lib/auth";
import { useIG, wordmark } from "@/theme/ig";

/**
 * Login — Instagram's login screen. Authentication happens on Instagram's own
 * page (the webview), so we never see the password; we surface the account-risk
 * disclosure up front (SPRINT §1) before connecting.
 */
export default function Login() {
  const c = useIG();
  const insets = useSafeAreaInsets();
  const { setStatus } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToken(token: string) {
    const status = await completeLogin(token);
    if (status === "signed_in") setStatus("signed_in");
    else {
      setError("Couldn't verify that session. Please try logging in again.");
      setConnecting(false);
    }
  }

  if (connecting) {
    return <IGLoginWebView onToken={onToken} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={styles.center}>
        <Text style={[wordmark, styles.wordmark, { color: c.text }]}>Instagram</Text>

        <Pressable
          style={[styles.button, { backgroundColor: c.link }]}
          onPress={() => {
            setError(null);
            setConnecting(true);
          }}
        >
          <Text style={styles.buttonText}>Log in</Text>
        </Pressable>

        {error ? <Text style={[styles.error, { color: c.like }]}>{error}</Text> : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.disclosure, { color: c.secondary }]}>
          You'll sign in on Instagram's own page — your password stays on Instagram and only a
          session is stored securely on this device. This is an unofficial client; using it is
          against Instagram's terms and could put your account at risk.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  wordmark: { fontSize: 52, lineHeight: 64 },
  button: {
    alignSelf: "stretch",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  error: { fontSize: 13, textAlign: "center" },
  footer: { alignItems: "center" },
  disclosure: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
