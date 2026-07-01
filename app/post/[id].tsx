import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { StateView } from "@/components/StateView";
import { useFeed } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import type { Post } from "@/types/social";

/**
 * Single post view — reached by tapping a grid tile (profile / explore). Reuses
 * the cached feed so no extra fetch is needed, and renders the same PostCard so
 * the post looks and behaves exactly as it does in the feed.
 */
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const feed = useFeed();

  const post = useMemo<Post | undefined>(
    () => feed.data?.pages.flatMap((p) => p.items).find((p) => p.id === id),
    [feed.data, id],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={c.icon} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Posts</Text>
        <View style={{ width: 26 }} />
      </View>

      {post ? (
        <ScrollView>
          <PostCard post={post} active={post.media[0]?.kind === "video"} />
        </ScrollView>
      ) : (
        <StateView title="Post unavailable" message="We couldn't find this post." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "700" },
});
