import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

/**
 * FeedVideo — an Instagram feed video: autoplays (muted, looping) when it's the
 * post in view, pauses otherwise, with a tap mute toggle. Isolated here so the
 * player is swappable (expo-av today; expo-video later) without touching PostCard
 * — the same "one place to swap" discipline as the SocialProvider layer.
 *
 * Playback is declarative via `shouldPlay`, so it can't drift out of sync with
 * viewability. A poster (the cover frame) shows until the first frame decodes.
 */
export function FeedVideo({
  uri,
  poster,
  active,
}: {
  uri: string;
  poster?: string;
  active: boolean;
}) {
  const [muted, setMuted] = useState(true);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Video
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay={active}
        isMuted={muted}
        isLooping
        usePoster={!!poster}
        posterSource={poster ? { uri: poster } : undefined}
        posterStyle={{ resizeMode: "cover" }}
      />
      <Pressable style={styles.mute} onPress={() => setMuted((m) => !m)} hitSlop={10}>
        <Ionicons name={muted ? "volume-mute" : "volume-high"} size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mute: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
