import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import type { Post } from "@/types/social";

/**
 * Search — IG's search field over an Explore grid. v1 is search-only (no query
 * backend yet); the grid reuses feed media so the tab feels real. Full Explore,
 * with all Reels-only surfaces stripped, lands in Phase 2 (OPEN-QUESTIONS #10).
 */
export default function Search() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const feed = useFeed();

  const grid = useMemo<Post[]>(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.searchWrap}>
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
      </View>

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
    </View>
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
  tile: { flex: 1, aspectRatio: 1, margin: 0.5 },
  tileImg: { width: "100%", height: "100%" },
  tileIcon: { position: "absolute", top: 6, right: 6, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 3 },
});
