#import "SceneDelegate.h"
#import "AppDelegate.h"

@implementation SceneDelegate

/**
 * iOS 26 requires UIScene lifecycle. This delegate is registered via
 * UISceneDelegateClassName in Info.plist.
 *
 * React Native (via RCTAppDelegate / EXAppDelegateWrapper) creates the UIWindow
 * and sets up the React root view controller inside
 * application:didFinishLaunchingWithOptions: — which runs BEFORE this method.
 *
 * We must NOT create a new UIWindow here (that would discard the RN root view).
 * Instead we just associate the already-created AppDelegate window with this
 * UIWindowScene so iOS 26 is satisfied.
 */
- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  UIWindowScene *windowScene = (UIWindowScene *)scene;
  AppDelegate *appDelegate = (AppDelegate *)[UIApplication sharedApplication].delegate;

  if (appDelegate.window) {
    // Connect the existing RN window to the new UIWindowScene.
    // This is all iOS 26 needs — no new window, no new root view controller.
    appDelegate.window.windowScene = windowScene;
  }
}

- (void)sceneDidDisconnect:(UIScene *)scene {}
- (void)sceneDidBecomeActive:(UIScene *)scene {}
- (void)sceneWillResignActive:(UIScene *)scene {}
- (void)sceneWillEnterForeground:(UIScene *)scene {}
- (void)sceneDidEnterBackground:(UIScene *)scene {}

@end
