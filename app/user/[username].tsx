import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StateView } from "@/components/StateView";
import { useProfile, useUserPosts } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import type { Post } from "@/types/social";

/**
 * A read-only view of any account's real profile + posts, reached from search.
 * Uses the same hooks as the profile tab — the provider resolves a username to
 * the web_profile_info endpoint, so this works for any public account.
 */
export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useProfile(username);
  const posts = useUserPosts(username);

  const grid = useMemo<Post[]>(
    () => posts.data?.pages.flatMap((p) => p.items) ?? [],
    [posts.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={c.icon} />
        </Pressable>
        <Text style={[styles.handle, { color: c.text }]} numberOfLines={1}>
          {profile.data?.username ?? username}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {profile.isError ? (
        <StateView tone="danger" title="Couldn't load this profile" message="Try again shortly." />
      ) : profile.isPending ? (
        <StateView loading />
      ) : (
        <FlashList
          data={grid}
          numColumns={3}
          keyExtractor={(p) => p.id}
          estimatedItemSize={130}
          onEndReachedThreshold={0.6}
          onEndReached={() => posts.hasNextPage && posts.fetchNextPage()}
          renderItem={({ item }) => (
            <View style={styles.tile}>
              <Image source={item.media[0]?.url} style={styles.tileImg} contentFit="cover" recyclingKey={item.id} />
            </View>
          )}
          ListEmptyComponent={
            posts.isPending ? null : (
              <StateView title="No posts yet" message={`@${profile.data?.username ?? username} hasn't posted.`} />
            )
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <Image source={profile.data?.avatarUrl} style={styles.avatar} contentFit="cover" />
                <Stat value={profile.data?.postCount} label="Posts" text={c.text} secondary={c.secondary} />
                <Stat value={profile.data?.followerCount} label="Followers" text={c.text} secondary={c.secondary} />
                <Stat value={profile.data?.followingCount} label="Following" text={c.text} secondary={c.secondary} />
              </View>
              <Text style={[styles.name, { color: c.text }]}>
                {profile.data?.fullName ?? profile.data?.username}
              </Text>
              {profile.data?.bio ? <Text style={[styles.bio, { color: c.text }]}>{profile.data.bio}</Text> : null}
              <View style={[styles.followBtn, { backgroundColor: c.link }]}>
                <Text style={styles.followText}>Follow</Text>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

function Stat({
  value,
  label,
  text,
  secondary,
}: {
  value?: number;
  label: string;
  text: string;
  secondary: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: text }]}>{value?.toLocaleString() ?? "—"}</Text>
      <Text style={[styles.statLabel, { color: secondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handle: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 86, height: 86, borderRadius: 43, marginRight: 20 },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 13, marginTop: 2 },
  name: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  bio: { fontSize: 14, marginTop: 2, lineHeight: 19 },
  followBtn: { marginTop: 14, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  followText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tile: { flex: 1, aspectRatio: 1, margin: 0.5 },
  tileImg: { width: "100%", height: "100%" },
});
