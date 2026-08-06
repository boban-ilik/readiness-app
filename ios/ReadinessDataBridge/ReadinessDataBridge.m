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

@end
