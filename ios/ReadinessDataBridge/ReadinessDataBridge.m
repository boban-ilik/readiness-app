#import <React/RCTBridgeModule.h>

RCT_EXTERN_MODULE(ReadinessDataBridge, NSObject)

RCT_EXTERN_METHOD(
  writeScore:(NSNumber *)score
  label:(NSString *)label
  recovery:(NSNumber *)recovery
  sleep:(NSNumber *)sleep
  stress:(NSNumber *)stress
)
