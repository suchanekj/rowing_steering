import { Platform } from "react-native";
import { DefaultTheme } from "react-native-paper";

const font = Platform.select({ default: "Roboto", ios: "Helvetica" });
const fontSize = Platform.select({ default: 10, ios: 16 });

const theme = {
  ...DefaultTheme,
  roundness: 4,
};

export default theme;
