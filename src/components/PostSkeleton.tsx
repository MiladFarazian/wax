import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useIG } from "@/theme/ig";

/**
 * Calm gray placeholders shown while the feed loads — the "instant, calm"
 * loading the SPRINT promises (§3.1) instead of a spinner on a blank screen.
 */
function PostSkeleton() {
  const c = useIG();
  const { width } = useWindowDimensions();
  const g = c.inputBg;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: g }]} />
        <View style={[styles.line, { backgroundColor: g, width: 120 }]} />
      </View>
      <View style={{ width, height: width, backgroundColor: g }} />
      <View style={styles.actions}>
        <View style={[styles.line, { backgroundColor: g, width: 96 }]} />
      </View>
      <View style={styles.body}>
        <View style={[styles.line, { backgroundColor: g, width: "45%" }]} />
        <View style={[styles.line, { backgroundColor: g, width: "80%" }]} />
      </View>
    </View>
  );
}

/** Story-rail placeholder + a couple of post skeletons for the initial load. */
export function FeedSkeleton() {
  const c = useIG();
  return (
    <View>
      <View style={[styles.rail, { borderBottomColor: c.separator }]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.storyCircle, { backgroundColor: c.inputBg }]} />
        ))}
      </View>
      <PostSkeleton />
      <PostSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 6 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  line: { height: 10, borderRadius: 5 },
  actions: { paddingHorizontal: 12, paddingVertical: 12 },
  body: { paddingHorizontal: 12, gap: 8 },
  rail: { flexDirection: "row", gap: 14, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  storyCircle: { width: 66, height: 66, borderRadius: 33 },
});
