import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { useFeed, useStoryTrays } from "@/lib/hooks";
import { useTheme } from "@/theme/useTheme";
import { spacing, type } from "@/theme/tokens";
import type { Post } from "@/types/social";

/** Home feed — virtualized with FlashList for 60fps scrolling (SPRINT §3.1). */
export default function HomeFeed() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const feed = useFeed();
  const stories = useStoryTrays();

  const posts = useMemo<Post[]>(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={styles.brandBar}>
        <Text style={[type.display, { color: c.text, fontSize: 26 }]}>Wax</Text>
      </View>

      <FlashList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        estimatedItemSize={520}
        onEndReachedThreshold={0.6}
        onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
        ListHeaderComponent={
          <StoryRail trays={stories.data ?? []} accent={c.accent} hairline={c.hairline} textColor={c.text} />
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <ActivityIndicator color={c.accent} style={{ marginVertical: spacing.lg }} />
          ) : null
        }
      />
    </View>
  );
}

function StoryRail({
  trays,
  accent,
  hairline,
  textColor,
}: {
  trays: { user: { id: string; username: string; avatarUrl?: string }; seen: boolean }[];
  accent: string;
  hairline: string;
  textColor: string;
}) {
  return (
    <View style={[styles.rail, { borderBottomColor: hairline }]}>
      <FlashList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={trays}
        keyExtractor={(t) => t.user.id}
        estimatedItemSize={72}
        renderItem={({ item }) => (
          <View style={styles.story}>
            <View style={[styles.ring, { borderColor: item.seen ? hairline : accent }]}>
              <Image source={item.user.avatarUrl} style={styles.storyAvatar} contentFit="cover" />
            </View>
            <Text numberOfLines={1} style={[type.caption, { color: textColor, width: 64, textAlign: "center" }]}>
              {item.user.username}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brandBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rail: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, height: 104 },
  story: { alignItems: "center", marginHorizontal: spacing.xs, gap: 4 },
  ring: { padding: 2, borderRadius: 999, borderWidth: 2 },
  storyAvatar: { width: 56, height: 56, borderRadius: 28 },
});
