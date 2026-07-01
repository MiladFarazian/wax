import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "@/lib/hooks";
import { useIG } from "@/theme/ig";

/**
 * Edit profile — Instagram's edit form (SPRINT §4). Prefilled from the current
 * profile; "Done" is a Phase-2 stub (no updateProfile on the provider yet) and
 * simply returns.
 */
export default function EditProfile() {
  const c = useIG();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useProfile("u_me");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");

  // Prefill once the profile loads.
  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.fullName ?? "");
    setUsername(profile.data.username ?? "");
    setBio(profile.data.bio ?? "");
    setLink(profile.data.website ?? "");
  }, [profile.data]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.headerBtn, { color: c.text }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Edit profile</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.headerBtn, { color: c.link, fontWeight: "700" }]}>Done</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.photo}>
            <Image source={profile.data?.avatarUrl} style={styles.avatar} contentFit="cover" />
            <Text style={[styles.change, { color: c.link }]}>Change profile photo</Text>
          </View>

          <Field label="Name" value={name} onChangeText={setName} c={c} />
          <Field label="Username" value={username} onChangeText={setUsername} c={c} autoCapitalize="none" />
          <Field label="Bio" value={bio} onChangeText={setBio} c={c} multiline />
          <Field label="Link" value={link} onChangeText={setLink} c={c} placeholder="Add link" autoCapitalize="none" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  c,
  multiline,
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  c: ReturnType<typeof useIG>;
  multiline?: boolean;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={[styles.field, { borderBottomColor: c.separator }]}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.secondary}
        style={[styles.input, { color: c.text }]}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
      />
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
  headerBtn: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: "700" },
  photo: { alignItems: "center", paddingVertical: 20, gap: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  change: { fontSize: 15, fontWeight: "600" },
  field: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { width: 92, fontSize: 15, paddingTop: 4 },
  input: { flex: 1, fontSize: 15, paddingVertical: 4, minHeight: 24 },
});
