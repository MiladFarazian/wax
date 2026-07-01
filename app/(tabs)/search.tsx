import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIG } from "@/theme/ig";

/**
 * Search — IG's gray search field. v1 is search-only; full Explore lands in
 * Phase 2 with all Reels-only surfaces stripped (SPRINT §3.3, OPEN-QUESTIONS #10).
 */
export default function Search() {
  const c = useIG();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
      <View style={[styles.field, { backgroundColor: c.inputBg }]}>
        <Ionicons name="search" size={17} color={c.secondary} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search"
          placeholderTextColor={c.secondary}
          style={[styles.input, { color: c.text }]}
        />
      </View>
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: c.secondary }]}>
          Search people and posts.{"\n"}No Reels here — just what you came for.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15, textAlign: "center", lineHeight: 21 },
});
