import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/useTheme";
import { spacing, type } from "@/theme/tokens";
import { useToggleLike } from "@/lib/hooks";
import type { Post } from "@/types/social";

/**
 * PostCard — an Instagram-style feed post (photo/carousel). Inside the social
 * surface we mirror IG's neutral, familiar layout (docs/SPRINT.md §4). There is
 * no Reels variant — Wax never renders Reels.
 */
function PostCardImpl({ post }: { post: Post }) {
  const c = useTheme();
  const toggleLike = useToggleLike();
  const media = post.media[0];

  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <View style={styles.header}>
        <Image source={post.author.avatarUrl} style={styles.avatar} contentFit="cover" />
        <Text style={[type.label, { color: c.text, flex: 1 }]}>
          {post.author.username}
          {post.author.isVerified ? "  ✓" : ""}
        </Text>
        {post.isSponsored ? (
          <Text style={[type.caption, { color: c.muted }]}>Sponsored</Text>
        ) : null}
      </View>

      <Image
        source={media?.url}
        placeholder={media?.blurhash}
        style={styles.media}
        contentFit="cover"
        transition={120}
        recyclingKey={post.id}
      />

      <View style={styles.actions}>
        <Pressable
          hitSlop={8}
          onPress={() => toggleLike.mutate({ postId: post.id, like: !post.likedByMe })}
        >
          <Text style={[styles.icon, { color: post.likedByMe ? "#E0245E" : c.text }]}>
            {post.likedByMe ? "♥" : "♡"}
          </Text>
        </Pressable>
        <Text style={[styles.icon, { color: c.text }]}>💬</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.icon, { color: post.savedByMe ? c.accent : c.text }]}>
          {post.savedByMe ? "★" : "☆"}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[type.label, { color: c.text }]}>
          {post.likeCount.toLocaleString()} likes
        </Text>
        {post.caption ? (
          <Text style={[type.body, { color: c.text, marginTop: 2 }]}>
            <Text style={type.label}>{post.author.username} </Text>
            {post.caption}
          </Text>
        ) : null}
        {post.commentCount > 0 ? (
          <Text style={[type.caption, { color: c.muted, marginTop: 4 }]}>
            View all {post.commentCount} comments
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  media: { width: "100%", aspectRatio: 1 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: { fontSize: 22 },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});

/** Memoized so FlashList recycling stays at 60fps (docs/SPRINT.md §3.1). */
export const PostCard = memo(PostCardImpl);
