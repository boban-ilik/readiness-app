/**
 * Loads the Apple Health native module once, for every file that talks to it.
 *
 * react-native-health builds its export with Object.assign({}, NativeModules
 * .AppleHealthKit, ...). Under React Native's New Architecture (Expo SDK 58)
 * the native module is a host object, and copying it that way can leave the
 * export without its methods. Every caller then saw "not linked" and the app
 * fell back to its demo data. Reading the native module directly avoids the
 * copy. The reason is kept so a failure can be shown, never hidden.
 */

import { Platform } from 'react-native';

export type HealthKitLoadReason = 'ok' | 'not_ios' | 'no_native_module' | 'no_methods' | 'load_error';

let cached: { module: any | null; reason: HealthKitLoadReason } | null = null;

function load(): { module: any | null; reason: HealthKitLoadReason } {
  if (Platform.OS !== 'ios') return { module: null, reason: 'not_ios' };
  try {
    const RN = require('react-native');
    let native = RN.NativeModules?.AppleHealthKit;
    if (!native && RN.TurboModuleRegistry?.get) native = RN.TurboModuleRegistry.get('AppleHealthKit');
    if (!native) return { module: null, reason: 'no_native_module' };
    if (typeof native.initHealthKit !== 'function') {
      // Last resort: the library's own export, in case it does work.
      const rnh = require('react-native-health');
      const lib = rnh?.HealthKit ?? rnh?.default ?? rnh;
      if (typeof lib?.initHealthKit === 'function') return { module: lib, reason: 'ok' };
      return { module: null, reason: 'no_methods' };
    }
    return { module: native, reason: 'ok' };
  } catch {
    return { module: null, reason: 'load_error' };
  }
}

export function healthKitModule(): any | null {
  if (!cached) cached = load();
  return cached.module;
}

export function healthKitLoadReason(): HealthKitLoadReason {
  if (!cached) cached = load();
  return cached.reason;
}
