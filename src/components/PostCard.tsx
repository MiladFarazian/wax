import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useIG } from "@/theme/ig";
import { timeAgo } from "@/lib/time";
import { useToggleLike } from "@/lib/hooks";
import type { Post } from "@/types/social";

/**
 * PostCard — an Instagram feed post, mirrored 1:1 (docs/SPRINT.md §4): avatar +
 * username header with a more menu, full-bleed square media, the heart/comment/
 * share + bookmark action row, likes, caption, comments link, and a relative
 * timestamp. There is no Reels variant — Wax never renders Reels.
 */
function PostCardImpl({ post }: { post: Post }) {
  const c = useIG();
  const toggleLike = useToggleLike();
  const media = post.media[0];
  const isVideo = media?.kind === "video";
  const isCarousel = post.kind === "carousel" || post.media.length > 1;

  return (
    <View style={[styles.card, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={post.author.avatarUrl} style={styles.avatar} contentFit="cover" />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.username, { color: c.text }]}>{post.author.username}</Text>
            {post.author.isVerified ? (
              <Ionicons name="checkmark-circle" size={13} color={c.link} style={{ marginLeft: 3 }} />
            ) : null}
          </View>
          {post.isSponsored ? (
            <Text style={[styles.sub, { color: c.secondary }]}>Sponsored</Text>
          ) : null}
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={c.icon} />
      </View>

      {/* Media */}
      <View style={styles.mediaWrap}>
        <Image
          source={media?.url}
          placeholder={media?.blurhash}
          style={styles.media}
          contentFit="cover"
          transition={120}
          recyclingKey={post.id}
        />
        {isCarousel ? (
          <View style={styles.countBadge} pointerEvents="none">
            <Text style={styles.countText}>1/{post.media.length}</Text>
          </View>
        ) : null}
        {isVideo ? (
          <View style={styles.playWrap} pointerEvents="none">
            <View style={styles.playCircle}>
              <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </View>
        ) : null}
      </View>

      {/* Carousel dots */}
      {isCarousel ? (
        <View style={styles.dots}>
          {post.media.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === 0 ? c.link : c.separator }]}
            />
          ))}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          hitSlop={8}
          onPress={() => toggleLike.mutate({ postId: post.id, like: !post.likedByMe })}
        >
          <Ionicons
            name={post.likedByMe ? "heart" : "heart-outline"}
            size={26}
            color={post.likedByMe ? c.like : c.icon}
          />
        </Pressable>
        <Ionicons name="chatbubble-outline" size={25} color={c.icon} style={styles.action} />
        <Ionicons name="paper-plane-outline" size={25} color={c.icon} style={styles.action} />
        <View style={{ flex: 1 }} />
        <Ionicons name={post.savedByMe ? "bookmark" : "bookmark-outline"} size={25} color={c.icon} />
      </View>

      {/* Meta */}
      <View style={styles.body}>
        <Text style={[styles.likes, { color: c.text }]}>{post.likeCount.toLocaleString()} likes</Text>
        {post.caption ? (
          <Text style={[styles.caption, { color: c.text }]} numberOfLines={2}>
            <Text style={styles.username}>{post.author.username} </Text>
            {post.caption}
          </Text>
        ) : null}
        {post.commentCount > 0 ? (
          <Text style={[styles.comments, { color: c.secondary }]}>
            View all {post.commentCount.toLocaleString()} comments
          </Text>
        ) : null}
        <Text style={[styles.time, { color: c.secondary }]}>{timeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 6 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  headerText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  username: { fontSize: 13, fontWeight: "600" },
  sub: { fontSize: 11, marginTop: 1 },
  mediaWrap: { width: "100%", aspectRatio: 1 },
  media: { width: "100%", height: "100%" },
  countBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  playWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 4, paddingTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  action: { marginLeft: 16 },
  body: { paddingHorizontal: 12, paddingBottom: 8 },
  likes: { fontSize: 14, fontWeight: "600" },
  caption: { fontSize: 14, marginTop: 3, lineHeight: 18 },
  comments: { fontSize: 14, marginTop: 4 },
  time: { fontSize: 11, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.2 },
});

/** Memoized so FlashList recycling stays at 60fps (docs/SPRINT.md §3.1). */
export const PostCard = memo(PostCardImpl);
