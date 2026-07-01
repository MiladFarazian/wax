import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useIG } from "@/theme/ig";
import { radius, spacing, type } from "@/theme/tokens";

/**
 * StateView — the calm, on-brand placeholder for loading / empty / error.
 *
 * One component for every "there's nothing to render yet" moment so the whole
 * app degrades consistently (docs/SPRINT.md §3.1 "polished empty/loading states",
 * §2.5 trust). Compose it: `loading` shows a spinner; `title`/`message` show
 * copy; an `onAction`+`actionLabel` pair adds a retry button.
 */
export function StateView({
  loading = false,
  title,
  message,
  actionLabel,
  onAction,
  tone = "neutral",
}: {
  loading?: boolean;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "neutral" | "danger";
}) {
  const c = useIG();
  return (
    <View style={styles.root}>
      {loading ? <ActivityIndicator color={c.secondary} /> : null}
      {title ? (
        <Text
          style={[
            type.title,
            { color: tone === "danger" ? c.like : c.text, textAlign: "center", marginTop: loading ? spacing.md : 0 },
          ]}
        >
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text style={[type.body, { color: c.secondary, textAlign: "center", marginTop: spacing.sm }]}>
          {message}
        </Text>
      ) : null}
      {onAction && actionLabel ? (
        <Pressable
          onPress={onAction}
          style={[styles.button, { backgroundColor: c.link }]}
          hitSlop={8}
        >
          <Text style={[type.label, { color: "#fff" }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
