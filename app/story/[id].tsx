import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStoryTrays } from "@/lib/hooks";
import { timeAgo } from "@/lib/time";
import type { StoryItem, StoryTray } from "@/types/social";

/** How long each story frame plays before auto-advancing (IG is ~5s). */
const FRAME_MS = 5000;

/**
 * Full-screen story viewer, mirrored from Instagram (docs/SPRINT.md §4):
 * segmented progress bars up top, tap the right/left half to go forward/back,
 * auto-advance through the frames, and close at the end. Press-and-hold pauses.
 */
export default function StoryViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trays = useStoryTrays();

  const tray = useMemo<StoryTray | undefined>(
    () => trays.data?.find((t: StoryTray) => t.user.id === id),
    [trays.data, id],
  );
  const items: StoryItem[] = tray?.items ?? [];
  const [idx, setIdx] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  const close = useCallback(() => router.back(), [router]);

  const advance = useCallback(() => {
    setIdx((i) => {
      if (i < items.length - 1) return i + 1;
      close();
      return i;
    });
  }, [items.length, close]);

  // Drive the active frame's progress bar and auto-advance when it fills.
  useEffect(() => {
    if (!items.length) return;
    progress.setValue(0);
    const run = Animated.timing(progress, { toValue: 1, duration: FRAME_MS, useNativeDriver: false });
    anim.current = run;
    run.start(({ finished }) => finished && advance());
    return () => run.stop();
  }, [idx, items.length, progress, advance]);

  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => advance();
  const pause = () => anim.current?.stop();
  const resume = () => {
    const remaining = FRAME_MS; // simple resume; restarts the current frame's timer
    Animated.timing(progress, { toValue: 1, duration: remaining, useNativeDriver: false }).start(
      ({ finished }) => finished && advance(),
    );
  };

  if (!items.length) {
    return (
      <View style={[styles.root, styles.center]}>
        <Pressable onPress={close} hitSlop={12}>
          <Ionicons name="close" size={30} color="#fff" />
        </Pressable>
      </View>
    );
  }

  const item = items[Math.min(idx, items.length - 1)];

  return (
    <View style={styles.root}>
      <Image source={item.media.url} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />

      {/* Top gradient scrim substitute + controls */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <View style={styles.bars}>
          {items.map((_, i) => (
            <View key={i} style={styles.track}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    width:
                      i < idx
                        ? "100%"
                        : i === idx
                          ? progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                          : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.headerRow}>
          <Image source={tray?.user.avatarUrl} style={styles.avatar} contentFit="cover" />
          <Text style={styles.username}>{tray?.user.username}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={close} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Tap zones: left = back, right = forward; hold to pause */}
      <View style={styles.zones}>
        <Pressable style={styles.zone} onPress={goPrev} onLongPress={pause} onPressOut={resume} delayLongPress={200} />
        <Pressable style={styles.zone} onPress={goNext} onLongPress={pause} onPressOut={resume} delayLongPress={200} />
      </View>

      {/* Reply bar */}
      <View style={[styles.reply, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.replyField}>
          <TextInput
            placeholder={`Reply to ${tray?.user.username ?? ""}…`}
            placeholderTextColor="rgba(255,255,255,0.85)"
            style={styles.replyInput}
            onFocus={pause}
            onBlur={resume}
          />
        </View>
        <Ionicons name="heart-outline" size={26} color="#fff" />
        <Ionicons name="paper-plane-outline" size={26} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "flex-end", justifyContent: "flex-start", padding: 20, paddingTop: 60 },
  top: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 10 },
  bars: { flexDirection: "row", gap: 4 },
  track: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { color: "#fff", fontSize: 14, fontWeight: "600" },
  time: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  zones: { ...StyleSheet.absoluteFillObject, flexDirection: "row", top: 90, bottom: 84 },
  zone: { flex: 1 },
  reply: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  replyField: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 22,
    paddingHorizontal: 16,
    minHeight: 42,
    justifyContent: "center",
  },
  replyInput: { color: "#fff", fontSize: 15, paddingVertical: 8 },
});

