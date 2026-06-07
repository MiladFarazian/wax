import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed, useProfile } from "@/lib/hooks";
import { useTheme } from "@/theme/useTheme";
import { spacing, type } from "@/theme/tokens";

/**
 * Profile — IG-style header + 3-column post grid (docs/SPRINT.md §3.3).
 * Uses the current user ("u_me"); the grid reuses feed media for Phase 0.
 */
export default function Profile() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile("u_me");
  const feed = useFeed();

  const grid = useMemo(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <FlashList
        data={grid}
        numColumns={3}
        keyExtractor={(p) => p.id}
        estimatedItemSize={130}
        renderItem={({ item }) => (
          <Image source={item.media[0]?.url} style={styles.tile} contentFit="cover" recyclingKey={item.id} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Image source={profile.data?.avatarUrl} style={styles.avatar} contentFit="cover" />
              <Stat label="Posts" value={profile.data?.postCount} color={c.text} muted={c.muted} />
              <Stat label="Followers" value={profile.data?.followerCount} color={c.text} muted={c.muted} />
              <Stat label="Following" value={profile.data?.followingCount} color={c.text} muted={c.muted} />
            </View>
            <Text style={[type.label, { color: c.text, marginTop: spacing.sm }]}>
              {profile.data?.fullName ?? profile.data?.username}
            </Text>
            {profile.data?.bio ? (
              <Text style={[type.body, { color: c.text }]}>{profile.data.bio}</Text>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

function Stat({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value?: number;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[type.title, { color }]}>{value?.toLocaleString() ?? "—"}</Text>
      <Text style={[type.caption, { color: muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: spacing.md, gap: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  stat: { alignItems: "center", flex: 1 },
  tile: { flex: 1, aspectRatio: 1, margin: 1 },
});
