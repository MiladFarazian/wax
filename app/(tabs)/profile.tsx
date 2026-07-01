import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed, useProfile } from "@/lib/hooks";
import { useAuth } from "@/lib/AuthContext";
import { useIG } from "@/theme/ig";
import type { Post } from "@/types/social";

/**
 * Profile — Instagram's profile screen, mirrored (SPRINT §3.3, §4): username bar,
 * avatar + posts/followers/following stats, name + bio, Edit/Share buttons, the
 * grid/tagged tab strip, and a 3-column post grid. Sign-out lives behind the
 * header menu, standing in for IG's settings sheet.
 */
export default function Profile() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const profile = useProfile("u_me");
  const feed = useFeed();

  const grid = useMemo<Post[]>(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Username bar */}
      <View style={styles.topBar}>
        <View style={styles.nameRow}>
          {profile.data?.isPrivate ? <Ionicons name="lock-closed" size={14} color={c.icon} /> : null}
          <Text style={[styles.handle, { color: c.text }]}>{profile.data?.username ?? "you"}</Text>
          <Ionicons name="chevron-down" size={16} color={c.icon} />
        </View>
        <View style={styles.topIcons}>
          <Pressable hitSlop={8} onPress={() => router.push("/create")}>
            <Ionicons name="add-circle-outline" size={26} color={c.icon} />
          </Pressable>
          {/* Placeholder for IG's settings sheet — sign-out lives here for now. */}
          <Pressable hitSlop={8} onPress={signOut}>
            <Ionicons name="menu" size={26} color={c.icon} />
          </Pressable>
        </View>
      </View>

      <FlashList
        data={grid}
        numColumns={3}
        keyExtractor={(p) => p.id}
        estimatedItemSize={130}
        renderItem={({ item }) => (
          <GridTile post={item} onPress={() => router.push(`/post/${item.id}`)} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Image source={profile.data?.avatarUrl} style={styles.avatar} contentFit="cover" />
              <Stat value={profile.data?.postCount} label="Posts" text={c.text} secondary={c.secondary} />
              <Stat value={profile.data?.followerCount} label="Followers" text={c.text} secondary={c.secondary} />
              <Stat value={profile.data?.followingCount} label="Following" text={c.text} secondary={c.secondary} />
            </View>

            <Text style={[styles.name, { color: c.text }]}>
              {profile.data?.fullName ?? profile.data?.username}
            </Text>
            {profile.data?.bio ? <Text style={[styles.bio, { color: c.text }]}>{profile.data.bio}</Text> : null}
            {profile.data?.website ? (
              <Text style={[styles.link, { color: c.link }]}>{profile.data.website}</Text>
            ) : null}

            <View style={styles.buttons}>
              <ProfileButton label="Edit profile" bg={c.inputBg} text={c.text} onPress={() => router.push("/edit-profile")} />
              <ProfileButton label="Share profile" bg={c.inputBg} text={c.text} />
            </View>

            {/* Grid / tagged tab strip */}
            <View style={[styles.tabStrip, { borderTopColor: c.separator }]}>
              <View style={[styles.tab, { borderBottomColor: c.text }]}>
                <Ionicons name="grid" size={24} color={c.text} />
              </View>
              <View style={styles.tab}>
                <Ionicons name="person-outline" size={24} color={c.secondary} />
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

function GridTile({ post, onPress }: { post: Post; onPress: () => void }) {
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

function Stat({
  value,
  label,
  text,
  secondary,
}: {
  value?: number;
  label: string;
  text: string;
  secondary: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: text }]}>{value?.toLocaleString() ?? "—"}</Text>
      <Text style={[styles.statLabel, { color: secondary }]}>{label}</Text>
    </View>
  );
}

function ProfileButton({
  label,
  bg,
  text,
  onPress,
}: {
  label: string;
  bg: string;
  text: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.button, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={[styles.buttonText, { color: text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    height: 44,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  handle: { fontSize: 20, fontWeight: "700" },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 18 },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 86, height: 86, borderRadius: 43, marginRight: 20 },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 13, marginTop: 2 },
  name: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  bio: { fontSize: 14, marginTop: 2, lineHeight: 19 },
  link: { fontSize: 14, marginTop: 2, fontWeight: "500" },
  buttons: { flexDirection: "row", gap: 8, marginTop: 14 },
  button: { flex: 1, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 14, fontWeight: "600" },
  tabStrip: {
    flexDirection: "row",
    marginTop: 18,
    marginHorizontal: -16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "transparent" },
  tile: { flex: 1, aspectRatio: 1, margin: 0.5 },
  tileImg: { width: "100%", height: "100%" },
  tileIcon: { position: "absolute", top: 6, right: 6, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 3 },
});
