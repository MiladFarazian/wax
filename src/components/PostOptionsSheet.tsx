import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { useIG } from "@/theme/ig";

type IoniconName = keyof typeof Ionicons.glyphMap;
type Action = { key: string; label: string; icon: IoniconName; danger?: boolean };

/** Instagram's post "···" menu. Actions are Phase-2 stubs; they dismiss for now. */
const ACTIONS: Action[] = [
  { key: "report", label: "Report", icon: "alert-circle-outline", danger: true },
  { key: "unfollow", label: "Unfollow", icon: "person-remove-outline", danger: true },
  { key: "favorite", label: "Add to favorites", icon: "star-outline" },
  { key: "share", label: "Share to…", icon: "paper-plane-outline" },
  { key: "link", label: "Copy link", icon: "link-outline" },
  { key: "about", label: "About this account", icon: "information-circle-outline" },
];

export function PostOptionsSheet({
  visible,
  onClose,
  username,
}: {
  visible: boolean;
  onClose: () => void;
  username: string;
}) {
  const c = useIG();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {ACTIONS.map((a) => {
        const color = a.danger ? c.like : c.text;
        return (
          <Pressable key={a.key} style={styles.row} onPress={onClose} android_ripple={{ color: c.separator }}>
            <Ionicons name={a.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]}>
              {a.key === "unfollow" ? `Unfollow ${username}` : a.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={[styles.sep, { backgroundColor: c.separator }]} />
      <Pressable style={styles.row} onPress={onClose}>
        <Text style={[styles.label, styles.cancel, { color: c.text }]}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingVertical: 15 },
  label: { fontSize: 15 },
  cancel: { fontWeight: "600" },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
});
