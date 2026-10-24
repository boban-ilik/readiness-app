/**
 * ReadinessDataBridge: the native module that hands today's score to the
 * widget. Null where the native side isn't compiled in (Expo Go, web).
 */
import { requireOptionalNativeModule } from 'expo';

export interface ReadinessDataBridgeModule {
  writeScore(
    score:    number,
    label:    string,
    recovery: number,
    sleep:    number,
    stress:   number,
    trainingHeadline: string | null,
    trainingZone:     number | null,
  ): void;
}

const ReadinessDataBridge = requireOptionalNativeModule<ReadinessDataBridgeModule>('ReadinessDataBridge');
export default ReadinessDataBridge;
