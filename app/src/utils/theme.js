import { Platform } from "react-native";

const font = Platform.select({ default: "Roboto", ios: "Helvetica" });
const fontSize = Platform.select({ default: 10, ios: 16 });

const colors = {
  primary: "grey", // "#737f8a" - Light grey
  secondary: "#404040", // Header bar colour - Dark grey
  actionable: "#2089dc", // Actionable higlight colour - Light blue
  border: "#d5d5d5", // Very light grey
  background: "white",
};

const theme = {
  colors: colors,
  Text: {
    style: {
      fontSize: fontSize,
      fontFamily: font,
      fontWeight: "200",
      marginHorizontal: 16,
      marginVertical: 6,
    },
  },
  Divider: {
    style: { margin: 4, backgroundColor: colors.border },
  },
  Button: {
    containerStyle: {
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 10,
      paddingRight: 10,
    },
    buttonStyle: { borderWidth: 1 },
    titleStyle: {
      fontSize: fontSize,
      fontFamily: font,
      color: colors.secondary,
    },
  },
  ButtonGroup: {
    textStyle: {
      fontSize: fontSize,
      fontFamily: font,
      fontWeight: "normal",
      color: colors.secondary,
    },
    selectedTextStyle: { fontWeight: "500" },
    containerStyle: { borderColor: colors.primary, borderWidth: 1 },
    innerBorderStyle: { width: 0 },
  },
  ListItem: {
    titleStyle: { fontSize: Platform.select({ default: 14, ios: 18 }) },
    containerStyle: { paddingVertical: 10 },
  },
};

export default theme;
