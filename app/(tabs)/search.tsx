import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed, useSearch } from "@/lib/hooks";
import { useIG, type IGColors } from "@/theme/ig";
import type { Post, User } from "@/types/social";

/**
 * Search — IG's search field over an Explore grid. Typing runs a real user
 * search (topsearch); tapping a result opens that account's profile.
 */
export default function Search() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const feed = useFeed();
  const search = useSearch(q);

  const grid = useMemo<Post[]>(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );

  const query = q.trim();

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.searchWrap}>
        <View style={[styles.field, { backgroundColor: c.inputBg }]}>
          <Ionicons name="search" size={17} color={c.secondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search"
            placeholderTextColor={c.secondary}
            style={[styles.input, { color: c.text }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {q ? (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={c.secondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {query.length > 0 ? (
        <Results
          c={c}
          users={search.data ?? []}
          loading={search.isPending && search.fetchStatus !== "idle"}
          error={search.isError}
          onPick={(u) => router.push(`/user/${u.username}` as Href)}
        />
      ) : focused ? (
        <View style={styles.hint}>
          <Text style={[styles.hintText, { color: c.secondary }]}>Search for people by name or username.</Text>
        </View>
      ) : (
        <FlashList
          data={grid}
          numColumns={3}
          keyExtractor={(p) => p.id}
          estimatedItemSize={130}
          onEndReachedThreshold={0.6}
          onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
          renderItem={({ item }) => <ExploreTile post={item} />}
        />
      )}
    </View>
  );
}

function Results({
  c,
  users,
  loading,
  error,
  onPick,
}: {
  c: IGColors;
  users: User[];
  loading: boolean;
  error: boolean;
  onPick: (u: User) => void;
}) {
  if (loading) {
    return (
      <View style={styles.hint}>
        <ActivityIndicator color={c.secondary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.hint}>
        <Text style={[styles.hintText, { color: c.secondary }]}>Couldn't search right now. Try again.</Text>
      </View>
    );
  }
  if (users.length === 0) {
    return (
      <View style={styles.hint}>
        <Text style={[styles.hintText, { color: c.secondary }]}>No results.</Text>
      </View>
    );
  }
  return (
    <FlashList
      data={users}
      keyExtractor={(u) => u.id || u.username}
      estimatedItemSize={62}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onPick(item)}>
          <Image source={item.avatarUrl} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.user, { color: c.text }]}>{item.username}</Text>
              {item.isVerified ? (
                <Ionicons name="checkmark-circle" size={13} color={c.link} style={{ marginLeft: 3 }} />
              ) : null}
            </View>
            {item.fullName ? <Text style={[styles.full, { color: c.secondary }]}>{item.fullName}</Text> : null}
          </View>
        </Pressable>
      )}
    />
  );
}

function ExploreTile({ post }: { post: Post }) {
  const isCarousel = post.kind === "carousel" || post.media.length > 1;
  const isVideo = post.media[0]?.kind === "video";
  return (
    <View style={styles.tile}>
      <Image source={post.media[0]?.url} style={styles.tileImg} contentFit="cover" recyclingKey={post.id} />
      {isCarousel ? (
        <Ionicons name="copy" size={16} color="#fff" style={styles.tileIcon} />
      ) : isVideo ? (
        <Ionicons name="play" size={16} color="#fff" style={styles.tileIcon} />
      ) : null}
    </View>
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
  hint: { flex: 1, alignItems: "center", paddingTop: 28 },
  hintText: { fontSize: 14, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  user: { fontSize: 14, fontWeight: "600" },
  full: { fontSize: 13, marginTop: 1 },
  tile: { flex: 1, aspectRatio: 1, margin: 0.5 },
  tileImg: { width: "100%", height: "100%" },
  tileIcon: { position: "absolute", top: 6, right: 6, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 3 },
});
