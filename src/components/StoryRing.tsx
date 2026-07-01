import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { STORY_GRADIENT, useIG } from "@/theme/ig";

/**
 * A story avatar with Instagram's ring: the gradient (unseen) or a thin gray
 * ring (seen), a white gap, then the avatar — exactly IG's anatomy.
 */
export function StoryRing({
  uri,
  size = 66,
  seen = false,
}: {
  uri?: string;
  size?: number;
  seen?: boolean;
}) {
  const c = useIG();
  const gap = c.bg; // white gap between ring and avatar
  const inner = size - 6;
  const photo = inner - 4;

  if (seen) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: c.separator,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={uri}
          style={{ width: photo, height: photo, borderRadius: photo / 2 }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...STORY_GRADIENT]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: gap,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={uri}
          style={{ width: photo, height: photo, borderRadius: photo / 2 }}
          contentFit="cover"
        />
      </View>
    </LinearGradient>
  );
}
