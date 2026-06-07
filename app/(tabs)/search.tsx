import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";
import { radius, spacing, type } from "@/theme/tokens";

/**
 * Search — v1 is search-only (full Explore lands in Phase 2, with all
 * Reels-only surfaces stripped). See docs/SPRINT.md §3.3 and OPEN-QUESTIONS #10.
 */
export default function Search() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + spacing.sm }]}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search people and posts"
        placeholderTextColor={c.muted}
        style={[styles.input, { backgroundColor: c.card, color: c.text }]}
      />
      <View style={styles.empty}>
        <Text style={[type.body, { color: c.muted, textAlign: "center" }]}>
          Search people and posts.{"\n"}No Reels here — just what you came for.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.md },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...type.body,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
});
