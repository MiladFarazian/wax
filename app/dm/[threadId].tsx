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
import { useConversations, useMessages, useSendMessage } from "@/lib/hooks";
import { useIG } from "@/theme/ig";
import type { Conversation, DirectMessage } from "@/types/social";

const ME = "u_me";

/** DM thread — Instagram's chat view: message bubbles + a compose bar (SPRINT §4). */
export default function DMThread() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const convos = useConversations();
  const messages = useMessages(threadId);
  const send = useSendMessage(threadId);
  const [text, setText] = useState("");

  const convo = useMemo<Conversation | undefined>(
    () => convos.data?.pages.flatMap((p) => p.items).find((x: Conversation) => x.id === threadId),
    [convos.data, threadId],
  );
  const other = convo?.participants.find((p) => p.id !== ME) ?? convo?.participants[0];

  const items = useMemo<DirectMessage[]>(
    () => messages.data?.pages.flatMap((p) => p.items) ?? [],
    [messages.data],
  );

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    send.mutate(body);
    setText("");
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={c.icon} />
        </Pressable>
        <Image source={other?.avatarUrl} style={styles.headerAvatar} contentFit="cover" />
        <Text style={[styles.headerName, { color: c.text }]}>{other?.username ?? "Direct"}</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="call-outline" size={22} color={c.icon} style={{ marginRight: 16 }} />
        <Ionicons name="videocam-outline" size={24} color={c.icon} />
      </View>

      <FlashList
        data={items}
        inverted
        keyExtractor={(x) => x.id}
        estimatedItemSize={48}
        onEndReachedThreshold={0.6}
        onEndReached={() => messages.hasNextPage && messages.fetchNextPage()}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => {
          const mine = item.sender.id === ME;
          return (
            <View style={[styles.bubbleRow, { justifyContent: mine ? "flex-end" : "flex-start" }]}>
              {!mine ? (
                <Image source={item.sender.avatarUrl} style={styles.bubbleAvatar} contentFit="cover" />
              ) : null}
              <View
                style={[
                  styles.bubble,
                  mine
                    ? { backgroundColor: c.link, borderBottomRightRadius: 6 }
                    : { backgroundColor: c.inputBg, borderBottomLeftRadius: 6 },
                ]}
              >
                <Text style={{ color: mine ? "#fff" : c.text, fontSize: 15 }}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Compose */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.compose, { borderTopColor: c.separator, paddingBottom: insets.bottom + 8 }]}>
          <View style={[styles.field, { backgroundColor: c.inputBg }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message…"
              placeholderTextColor={c.secondary}
              style={[styles.input, { color: c.text }]}
              onSubmitEditing={submit}
              returnKeyType="send"
            />
          </View>
          {text.trim() ? (
            <Pressable onPress={submit} hitSlop={8}>
              <Text style={[styles.sendBtn, { color: c.link }]}>Send</Text>
            </Pressable>
          ) : (
            <Ionicons name="mic-outline" size={24} color={c.icon} />
          )}
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
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAvatar: { width: 28, height: 28, borderRadius: 14, marginLeft: 4 },
  headerName: { fontSize: 16, fontWeight: "600" },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 3 },
  bubbleAvatar: { width: 24, height: 24, borderRadius: 12 },
  bubble: { maxWidth: "72%", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  compose: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  field: { flex: 1, borderRadius: 20, paddingHorizontal: 14, minHeight: 38, justifyContent: "center" },
  input: { fontSize: 15, paddingVertical: 6 },
  sendBtn: { fontSize: 15, fontWeight: "600" },
});
