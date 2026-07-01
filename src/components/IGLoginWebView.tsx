import { useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import CookieManager from "@react-native-cookies/cookies";
import { IG_LOGIN_URL, IG_WEB_BASE } from "@/providers/ig/endpoints";
import { encodeIGToken } from "@/providers/ig/session";
import { useTheme } from "@/theme/useTheme";

/**
 * Loads Instagram's real login page in a webview. The user authenticates
 * directly with Instagram (including 2FA / checkpoints on IG's own page, which
 * is exactly why this path is far safer than us replaying a password). Once IG
 * sets its auth cookies, we capture them and hand back an opaque session token.
 *
 * Why the native cookie store and not `document.cookie`: Instagram sets
 * `sessionid` with the HttpOnly flag, so injected JS can never read it. We read
 * the WebView's native cookie jar (which does include HttpOnly cookies) and grab
 * sessionid + csrftoken (needed for writes) + ds_user_id (the viewer id) in one
 * shot. The token is stored only in on-device secure storage (see src/lib/auth.ts).
 */
export function IGLoginWebView({ onToken }: { onToken: (token: string) => void }) {
  const c = useTheme();
  const captured = useRef(false);
  const webRef = useRef<WebView>(null);

  async function probeCookies() {
    if (captured.current) return;
    // useWebKit=true so we read WKWebView's store on iOS, not the legacy one.
    const cookies = await CookieManager.get(IG_WEB_BASE, true);
    const sessionid = cookies.sessionid?.value;
    if (!sessionid) return; // not logged in yet
    captured.current = true;
    onToken(
      encodeIGToken({
        sessionid,
        csrftoken: cookies.csrftoken?.value,
        userId: cookies.ds_user_id?.value,
      }),
    );
  }

  function handleNavChange(_nav: WebViewNavigation) {
    // IG sets the auth cookies on the redirect that follows a successful login;
    // probe after each navigation until sessionid appears.
    void probeCookies();
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <WebView
        ref={webRef}
        source={{ uri: IG_LOGIN_URL }}
        onNavigationStateChange={handleNavChange}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={c.accent} />
          </View>
        )}
        // Use a realistic mobile UA so IG serves the mobile login.
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
});
