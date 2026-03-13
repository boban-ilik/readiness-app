#import <React/RCTBridgeModule.h>

@interface ReadinessDataBridge : NSObject <RCTBridgeModule>
@end

@implementation ReadinessDataBridge

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(writeScore:(NSInteger)score
                  label:(NSString *)label
                  recovery:(NSInteger)recovery
                  sleep:(NSInteger)sleep
                  stress:(NSInteger)stress)
{
  NSUserDefaults *defaults = [[NSUserDefaults alloc]
    initWithSuiteName:@"group.com.bobanilikj.readiness"];
  if (!defaults) return;

  NSDateFormatter *f = [[NSDateFormatter alloc] init];
  f.dateFormat = @"yyyy-MM-dd";

  NSDictionary *payload = @{
    @"score":    @(score),
    @"label":    label,
    @"date":     [f stringFromDate:[NSDate date]],
    @"recovery": @(recovery),
    @"sleep":    @(sleep),
    @"stress":   @(stress),
  };

  NSData *data = [NSJSONSerialization dataWithJSONObject:payload
                                                options:0
                                                  error:nil];
  if (data) {
    [defaults setObject:data forKey:@"readiness_widget_data"];
  }
}

@end
