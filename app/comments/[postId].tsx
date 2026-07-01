import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddComment, useComments, useProfile } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import { timeAgo } from "@/lib/time";
import type { Comment } from "@/types/social";

/** Comments — Instagram's comment thread with a bottom compose bar (SPRINT §4). */
export default function Comments() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comments = useComments(postId);
  const me = useProfile("u_me");
  const add = useAddComment(postId);
  const [text, setText] = useState("");

  const items = useMemo<Comment[]>(
    () => comments.data?.pages.flatMap((p) => p.items) ?? [],
    [comments.data],
  );

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    add.mutate(body);
    setText("");
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={c.icon} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Comments</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlashList
        data={items}
        keyExtractor={(x) => x.id}
        estimatedItemSize={64}
        onEndReachedThreshold={0.6}
        onEndReached={() => comments.hasNextPage && comments.fetchNextPage()}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={item.author.avatarUrl} style={styles.avatar} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { color: c.text }]}>
                <Text style={styles.name}>{item.author.username} </Text>
                {item.text}
              </Text>
              <Text style={[styles.meta, { color: c.secondary }]}>
                {timeAgo(item.createdAt)}
                {item.likeCount > 0 ? `  ·  ${item.likeCount.toLocaleString()} likes` : ""}
              </Text>
            </View>
            <Ionicons
              name={item.likedByMe ? "heart" : "heart-outline"}
              size={13}
              color={item.likedByMe ? c.like : c.secondary}
            />
          </View>
        )}
      />

      {/* Compose bar */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.compose, { borderTopColor: c.separator, paddingBottom: insets.bottom + 8 }]}>
          <Image source={me.data?.avatarUrl} style={styles.composeAvatar} contentFit="cover" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={c.secondary}
            style={[styles.input, { color: c.text }]}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          {text.trim() ? (
            <Pressable onPress={submit} hitSlop={8}>
              <Text style={[styles.post, { color: c.link }]}>Post</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 8 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  text: { fontSize: 14, lineHeight: 19 },
  name: { fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 4 },
  compose: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composeAvatar: { width: 30, height: 30, borderRadius: 15 },
  input: { flex: 1, fontSize: 14, paddingVertical: 6 },
  post: { fontSize: 14, fontWeight: "600" },
});
