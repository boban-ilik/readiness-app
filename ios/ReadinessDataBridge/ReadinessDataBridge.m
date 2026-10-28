//
//  ReadinessDataBridge.m
//  Readiness
//
//  Objective-C shim exposing the Swift ReadinessDataBridge module
//  to React Native's NativeModules registry.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ReadinessDataBridge, NSObject)

RCT_EXTERN_METHOD(writeScore:(nonnull NSNumber *)score
                  label:(nonnull NSString *)label
                  recovery:(nonnull NSNumber *)recovery
                  sleep:(nonnull NSNumber *)sleep
                  stress:(nonnull NSNumber *)stress)

RCT_EXTERN_METHOD(writeScoreWithTraining:(nonnull NSNumber *)score
                  label:(nonnull NSString *)label
                  recovery:(nonnull NSNumber *)recovery
                  sleep:(nonnull NSNumber *)sleep
                  stress:(nonnull NSNumber *)stress
                  trainingHeadline:(nonnull NSString *)trainingHeadline
                  trainingZone:(nonnull NSNumber *)trainingZone)

@end
