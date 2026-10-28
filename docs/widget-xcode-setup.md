# ReadinessWidget

The home-screen widget showing today's readiness score. The Xcode target, the
Swift sources, and the native bridge are all committed — there is no manual
Xcode setup left for local or simulator builds.

Verified working on the iOS 26.3 simulator: the widget appears in the widget
gallery, reads the score from App Group storage, and renders on the home screen
in both small and medium sizes.

---

## What's in the repo

| Path | Target | Purpose |
|---|---|---|
| `ios/ReadinessDataBridge/ReadinessDataBridge.swift` | Readiness | Writes the score to App Group storage, triggers a widget reload |
| `ios/ReadinessDataBridge/ReadinessDataBridge.m` | Readiness | Exposes the Swift class to React Native |
| `ios/ReadinessWidget/WidgetData.swift` | ReadinessWidget | Shared model + App Group reader |
| `ios/ReadinessWidget/ReadinessProvider.swift` | ReadinessWidget | TimelineProvider (30-minute refresh as a safety net) |
| `ios/ReadinessWidget/ReadinessWidget.swift` | ReadinessWidget | SwiftUI views — small and medium families |
| `ios/ReadinessWidget/ReadinessWidgetBundle.swift` | ReadinessWidget | `@main` entry point |

Both targets carry the `group.com.bobanilikj.readiness` App Group entitlement,
and the app embeds `ReadinessWidget.appex` in its `PlugIns/` folder.

---

## Still required before a device or TestFlight build

Simulator builds need none of this; signed builds do.

1. In the [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list)
   → **Identifiers → App Groups**, create `group.com.bobanilikj.readiness`.
2. Under **Identifiers → App IDs**, enable **App Groups** on
   `com.bobanilikj.readiness` and select that group.
3. Create an App ID for `com.bobanilikj.readiness.ReadinessWidget`, enable
   **App Groups**, and select the same group.
4. Let EAS regenerate credentials for the new extension bundle ID on the next
   build (`eas build` prompts for this automatically).

---

## Verifying the build

```bash
cd ios && xcodebuild -workspace Readiness.xcworkspace -scheme ReadinessWidget -destination 'generic/platform=iOS Simulator' build
```

---

## How data flows

```
App opens
  └─ useHealthData.ts computes score
       └─ pushScoreToWidget(result)          [widgetBridge.ts]
            └─ NativeModules.ReadinessDataBridge.writeScore(...)
                 └─ ReadinessDataBridge.swift writes JSON to
                    UserDefaults(suiteName: "group.com.bobanilikj.readiness")
                    + calls WidgetCenter.shared.reloadTimelines(ofKind: "ReadinessWidget")
                         └─ ReadinessProvider.getTimeline() reads AppGroupStorage.load()
                              └─ Widget re-renders with latest score
```

No network call needed — the widget reads directly from shared local storage.
Before the first score is computed, it shows an "Open Readiness" empty state.
