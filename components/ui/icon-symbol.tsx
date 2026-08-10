// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Tab icons
  "house.fill": "home",
  "map.fill": "map",
  "book.fill": "menu-book",
  "terminal.fill": "terminal",
  "person.fill": "person",
  "doc.text.fill": "article",
  // Navigation
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.left.forwardslash.chevron.right": "code",
  "paperplane.fill": "send",
  // Content
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "checkmark.circle.fill": "check-circle",
  "circle": "radio-button-unchecked",
  "star.fill": "star",
  "bolt.fill": "bolt",
  "flame.fill": "local-fire-department",
  "magnifyingglass": "search",
  "xmark": "close",
  "arrow.left": "arrow-back",
  "photo.fill": "photo",
  "info.circle.fill": "info",
  "trophy.fill": "emoji-events",
  "waveform": "graphic-eq",
  "cpu.fill": "memory",
  "shield.fill": "shield",
  "exclamationmark.triangle.fill": "warning",
  "checkmark": "check",
  "arrow.clockwise": "refresh",
  "trash.fill": "delete",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
