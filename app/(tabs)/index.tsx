import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { StoryRing } from "@/components/StoryRing";
import { StateView } from "@/components/StateView";
import { useFeed, useProfile, useStoryTrays } from "@/lib/hooks";
import { describeError } from "@/lib/errors";
import { useIG, wordmark } from "@/theme/ig";
import type { Post } from "@/types/social";
import type { StoryTray } from "@/types/social";

/** Home feed — virtualized with FlashList for 60fps scrolling (SPRINT §3.1). */
export default function HomeFeed() {
  const c = useIG();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const feed = useFeed();
  const stories = useStoryTrays();
  const me = useProfile("u_me");

  const posts = useMemo<Post[]>(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: c.separator }]}>
        <Text style={[wordmark, styles.wordmark, { color: c.text }]}>Wax</Text>
        <View style={styles.topIcons}>
          <Ionicons name="heart-outline" size={26} color={c.icon} />
          <Pressable hitSlop={8} onPress={() => router.push("/inbox")}>
            <Ionicons name="paper-plane-outline" size={25} color={c.icon} />
          </Pressable>
        </View>
      </View>

      {feed.isPending ? (
        <StateView loading title="Loading your feed…" />
      ) : feed.isError ? (
        <FeedError error={feed.error} onRetry={() => feed.refetch()} />
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          estimatedItemSize={560}
          onEndReachedThreshold={0.6}
          onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
          refreshing={feed.isRefetching && !feed.isFetchingNextPage}
          onRefresh={() => feed.refetch()}
          ListHeaderComponent={
            <StoryRail trays={stories.data ?? []} myAvatar={me.data?.avatarUrl} separator={c.separator} textColor={c.text} />
          }
          ListEmptyComponent={
            <StateView
              title="Your feed is quiet"
              message="No posts to show right now. Follow a few people and pull to refresh."
            />
          }
          ListFooterComponent={
            feed.isFetchingNextPage ? (
              <ActivityIndicator color={c.secondary} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

/** Feed-level failure surface: reassuring copy, retry only when it can help. */
function FeedError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const info = describeError(error);
  return (
    <StateView
      tone="danger"
      title={info.title}
      message={info.message}
      actionLabel={info.canRetry ? "Try again" : undefined}
      onAction={info.canRetry ? onRetry : undefined}
    />
  );
}

function StoryRail({
  trays,
  myAvatar,
  separator,
  textColor,
}: {
  trays: StoryTray[];
  myAvatar?: string;
  separator: string;
  textColor: string;
}) {
  const router = useRouter();
  return (
    <View style={[styles.rail, { borderBottomColor: separator }]}>
      <FlashList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={trays}
        keyExtractor={(t) => t.user.id}
        estimatedItemSize={76}
        ListHeaderComponent={<YourStory avatar={myAvatar} textColor={textColor} />}
        renderItem={({ item }) => (
          <Pressable style={styles.story} onPress={() => router.push(`/story/${item.user.id}`)}>
            <StoryRing uri={item.user.avatarUrl} seen={item.seen} />
            <Text numberOfLines={1} style={[styles.storyName, { color: textColor }]}>
              {item.user.username}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

/** The leading "Your story" bubble with a + badge, IG-style. */
function YourStory({ avatar, textColor }: { avatar?: string; textColor: string }) {
  const c = useIG();
  return (
    <View style={styles.story}>
      <View>
        <View style={[styles.myRing, { borderColor: c.separator }]}>
          <Image source={avatar} style={styles.myAvatar} contentFit="cover" />
        </View>
        <View style={[styles.plus, { backgroundColor: c.link, borderColor: c.bg }]}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </View>
      <Text numberOfLines={1} style={[styles.storyName, { color: textColor }]}>
        Your story
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordmark: { fontSize: 28, lineHeight: 34 },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 20 },
  rail: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  story: { alignItems: "center", marginHorizontal: 7, gap: 5, width: 72 },
  storyName: { fontSize: 12, width: 68, textAlign: "center" },
  myRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  myAvatar: { width: 60, height: 60, borderRadius: 30 },
  plus: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
