import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useIG } from "@/theme/ig";
import { timeAgo } from "@/lib/time";
import { useToggleLike, useToggleSave } from "@/lib/hooks";
import type { MediaItem, Post } from "@/types/social";

type IoniconName = keyof typeof Ionicons.glyphMap;

/** An icon button that pops (scale bounce) on tap, like IG's action row. */
function PopIcon({
  name,
  size,
  color,
  onPress,
}: {
  name: IoniconName;
  size: number;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Pressable hitSlop={8} onPress={handle}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={name} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
}

const DOUBLE_TAP_MS = 280;

/**
 * PostCard — an Instagram feed post, mirrored 1:1 (docs/SPRINT.md §4): header,
 * full-bleed square media with swipeable carousels, double-tap-to-like with the
 * heart burst, the heart/comment/share + bookmark row, likes, caption, comments,
 * and a relative timestamp. There is no Reels variant — Wax never renders Reels.
 */
function PostCardImpl({ post }: { post: Post }) {
  const c = useIG();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();
  const openComments = () => router.push(`/comments/${post.id}`);
  const media = post.media;
  const isCarousel = post.kind === "carousel" || media.length > 1;
  const isVideo = media[0]?.kind === "video";

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // FlashList recycles this component for other posts — reset the carousel.
  useEffect(() => {
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [post.id]);

  // Double-tap heart burst (RN Animated — no reanimated/babel dependency).
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const burst = useCallback(() => {
    scale.setValue(0.3);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, delay: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, [scale, opacity]);

  const onDoubleTap = useCallback(() => {
    if (!post.likedByMe) toggleLike.mutate({ postId: post.id, like: true });
    burst();
  }, [post.likedByMe, post.id, toggleLike, burst]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

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
          {post.isSponsored ? <Text style={[styles.sub, { color: c.secondary }]}>Sponsored</Text> : null}
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={c.icon} />
      </View>

      {/* Media */}
      <View style={[styles.mediaWrap, { width, height: width }]}>
        {isCarousel ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
          >
            {media.map((m, i) => (
              <TappableMedia key={i} media={m} size={width} recyclingKey={`${post.id}:${i}`} onDoubleTap={onDoubleTap} />
            ))}
          </ScrollView>
        ) : (
          <TappableMedia media={media[0]} size={width} recyclingKey={post.id} onDoubleTap={onDoubleTap} />
        )}

        {isCarousel ? (
          <View style={styles.countBadge} pointerEvents="none">
            <Text style={styles.countText}>{index + 1}/{media.length}</Text>
          </View>
        ) : null}

        {isVideo && !isCarousel ? (
          <View style={styles.overlayCenter} pointerEvents="none">
            <View style={styles.playCircle}>
              <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </View>
        ) : null}

        {/* Double-tap heart burst */}
        <View style={styles.overlayCenter} pointerEvents="none">
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <Ionicons name="heart" size={96} color="#fff" style={styles.burstHeart} />
          </Animated.View>
        </View>
      </View>

      {/* Carousel dots */}
      {isCarousel ? (
        <View style={styles.dots}>
          {media.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === index ? c.link : c.separator }]} />
          ))}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <PopIcon
          name={post.likedByMe ? "heart" : "heart-outline"}
          size={26}
          color={post.likedByMe ? c.like : c.icon}
          onPress={() => toggleLike.mutate({ postId: post.id, like: !post.likedByMe })}
        />
        <Pressable hitSlop={8} onPress={openComments} style={styles.action}>
          <Ionicons name="chatbubble-outline" size={25} color={c.icon} />
        </Pressable>
        <Ionicons name="paper-plane-outline" size={25} color={c.icon} style={styles.action} />
        <View style={{ flex: 1 }} />
        <PopIcon
          name={post.savedByMe ? "bookmark" : "bookmark-outline"}
          size={25}
          color={c.icon}
          onPress={() => toggleSave.mutate({ postId: post.id, save: !post.savedByMe })}
        />
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
          <Text style={[styles.comments, { color: c.secondary }]} onPress={openComments}>
            View all {post.commentCount.toLocaleString()} comments
          </Text>
        ) : null}
        <Text style={[styles.time, { color: c.secondary }]}>{timeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

/** A media page that likes the post on double-tap while letting swipes through. */
function TappableMedia({
  media,
  size,
  recyclingKey,
  onDoubleTap,
}: {
  media?: MediaItem;
  size: number;
  recyclingKey: string;
  onDoubleTap: () => void;
}) {
  const lastTap = useRef(0);
  const onPress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      onDoubleTap();
    } else {
      lastTap.current = now;
    }
  };
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size }}>
      <Image
        source={media?.url}
        placeholder={media?.blurhash}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={120}
        recyclingKey={recyclingKey}
      />
    </Pressable>
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
  mediaWrap: { position: "relative" },
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
  overlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  burstHeart: {
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
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
