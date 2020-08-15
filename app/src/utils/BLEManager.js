import { NativeModules, NativeEventEmitter } from "react-native";

const BleManagerModule = NativeModules.BleManager;
export const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
