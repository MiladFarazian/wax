import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed } from "@/lib/hooks";
import { useIG, type IGColors } from "@/theme/ig";
import type { Post } from "@/types/social";

/**
 * Search — IG's search field over an Explore grid, and a "Recent" list while the
 * field is focused. v1 has no query backend (Phase 2, OPEN-QUESTIONS #10); the
 * grid reuses feed media and Recent is illustrative so the tab feels real.
 */
const RECENT = [
  { id: "r1", username: "maya.rivera", name: "Maya Rivera", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "r2", username: "leowoods", name: "Leo Woods", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "r3", username: "the.hive", name: "The Hive Co.", avatar: "https://i.pravatar.cc/150?img=32" },
  { id: "r4", username: "sunny.k", name: "Sunny Kaur", avatar: "https://i.pravatar.cc/150?img=45" },
  { id: "r5", username: "field.notes", name: "Field Notes", avatar: "https://i.pravatar.cc/150?img=60" },
];

export default function Search() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const feed = useFeed();

  const grid = useMemo<Post[]>(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  const showRecent = focused || q.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.searchWrap}>
        <View style={[styles.field, { backgroundColor: c.inputBg }]}>
          <Ionicons name="search" size={17} color={c.secondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search"
            placeholderTextColor={c.secondary}
            style={[styles.input, { color: c.text }]}
            returnKeyType="search"
          />
          {q ? (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={c.secondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showRecent ? (
        <RecentList c={c} />
      ) : (
        <FlashList
          data={grid}
          numColumns={3}
          keyExtractor={(p) => p.id}
          estimatedItemSize={130}
          onEndReachedThreshold={0.6}
          onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
          renderItem={({ item }) => (
            <ExploreTile post={item} onPress={() => router.push(`/post/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

function RecentList({ c }: { c: IGColors }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={styles.recentHead}>
        <Text style={[styles.recentTitle, { color: c.text }]}>Recent</Text>
        <Text style={[styles.seeAll, { color: c.link }]}>See all</Text>
      </View>
      {RECENT.map((r) => (
        <View key={r.id} style={styles.recentRow}>
          <Image source={r.avatar} style={styles.recentAvatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.recentUser, { color: c.text }]}>{r.username}</Text>
            <Text style={[styles.recentName, { color: c.secondary }]}>{r.name}</Text>
          </View>
          <Ionicons name="close" size={20} color={c.secondary} />
        </View>
      ))}
    </ScrollView>
  );
}

function ExploreTile({ post, onPress }: { post: Post; onPress: () => void }) {
  const isCarousel = post.kind === "carousel" || post.media.length > 1;
  const isVideo = post.media[0]?.kind === "video";
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Image source={post.media[0]?.url} style={styles.tileImg} contentFit="cover" recyclingKey={post.id} />
      {isCarousel ? (
        <Ionicons name="copy" size={16} color="#fff" style={styles.tileIcon} />
      ) : isVideo ? (
        <Ionicons name="play" size={16} color="#fff" style={styles.tileIcon} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingHorizontal: 12, paddingBottom: 8 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  recentHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  recentTitle: { fontSize: 15, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  recentAvatar: { width: 44, height: 44, borderRadius: 22 },
  recentUser: { fontSize: 14, fontWeight: "600" },
  recentName: { fontSize: 13, marginTop: 1 },
  tile: { flex: 1, aspectRatio: 1, margin: 0.5 },
  tileImg: { width: "100%", height: "100%" },
  tileIcon: { position: "absolute", top: 6, right: 6, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 3 },
});
