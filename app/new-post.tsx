import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreatePost, useProfile } from "@/lib/hooks";
import { describeError } from "@/lib/errors";
import { useIG } from "@/theme/ig";

/**
 * New post — Instagram's create flow: pick a photo, write a caption, share.
 * On success the post is prepended to the feed and we return home. Uploading to
 * real Instagram is Phase 2 (the IG provider throws until then); on MockProvider
 * this works end-to-end.
 */
export default function Create() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useProfile("u_me");
  const create = useCreatePost();
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Wax needs photo access to share a post.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setUri(result.assets[0].uri);
  }

  // Open the picker immediately, IG-style.
  useEffect(() => {
    void pick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function share() {
    if (!uri) return;
    setError(null);
    try {
      await create.mutateAsync({ imageUri: uri, caption: caption.trim() });
      router.back();
    } catch (e) {
      setError(describeError(e).message);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={c.icon} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>New post</Text>
        {create.isPending ? (
          <ActivityIndicator color={c.link} />
        ) : (
          <Pressable onPress={share} hitSlop={10} disabled={!uri}>
            <Text style={[styles.share, { color: uri ? c.link : c.secondary }]}>Share</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.composer}>
          <Pressable onPress={pick} style={[styles.preview, { backgroundColor: c.inputBg }]}>
            {uri ? (
              <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={40} color={c.secondary} />
                <Text style={{ color: c.secondary, marginTop: 6 }}>Tap to select a photo</Text>
              </View>
            )}
          </Pressable>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption…"
            placeholderTextColor={c.secondary}
            style={[styles.caption, { color: c.text }]}
            multiline
          />

          {error ? <Text style={[styles.error, { color: c.like }]}>{error}</Text> : null}
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
    paddingHorizontal: 14,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "700" },
  share: { fontSize: 16, fontWeight: "700" },
  composer: { padding: 14, gap: 14 },
  preview: { width: 90, height: 90, borderRadius: 6, overflow: "hidden", alignSelf: "flex-start" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  caption: { fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  error: { fontSize: 13 },
});
