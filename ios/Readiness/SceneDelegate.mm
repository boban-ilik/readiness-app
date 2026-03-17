#import "SceneDelegate.h"
#import "AppDelegate.h"

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  // The AppDelegate (RCTAppDelegate subclass) owns the React instance and bridge.
  // We delegate window creation back to it so nothing in the RN pipeline changes.
  AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;

  UIWindowScene *windowScene = (UIWindowScene *)scene;
  self.window = [[UIWindow alloc] initWithWindowScene:windowScene];

  // Hand the window to the AppDelegate so RCTAppDelegate can attach the RootView
  appDelegate.window = self.window;
  [self.window makeKeyAndVisible];
}

- (void)sceneDidDisconnect:(UIScene *)scene {}
- (void)sceneDidBecomeActive:(UIScene *)scene {}
- (void)sceneWillResignActive:(UIScene *)scene {}
- (void)sceneWillEnterForeground:(UIScene *)scene {}
- (void)sceneDidEnterBackground:(UIScene *)scene {}

@end
