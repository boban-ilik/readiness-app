# Adding the ReadinessWidget to Xcode

All Swift source files and the native data bridge are already written. You need
to do four short things in Xcode to wire them in — none require writing code.

---

## 1 · Register the App Group in the Apple Developer portal

1. Go to [developer.apple.com](https://developer.apple.com) → **Identifiers**.
2. Click **App Groups** → **+** → create `group.com.bobanilikj.readiness`.
3. Back under **Identifiers → App IDs**, find `com.bobanilikj.readiness` and
   enable **App Groups**, select the group you just created.
4. Create a new App ID for the widget:
   - Bundle ID: `com.bobanilikj.readiness.ReadinessWidget`
   - Enable **App Groups**, select the same group.
5. Re-generate and download your provisioning profiles.

---

## 2 · Add the Widget Extension target in Xcode

1. Open `ios/Readiness.xcworkspace` in Xcode.
2. **File → New → Target…**
3. Choose **Widget Extension** → Next.
4. Fill in:
   - **Product Name:** `ReadinessWidget`
   - **Bundle Identifier:** `com.bobanilikj.readiness.ReadinessWidget`
   - **Include Configuration Intent:** ❌ (leave unchecked — we use StaticConfiguration)
5. Click **Finish**. When Xcode asks "Activate scheme?", click **Activate**.
6. Xcode will create a default widget file inside a new `ReadinessWidget/` folder.
   **Delete the default files Xcode generated** — our files are already in
   `ios/ReadinessWidget/`.

---

## 3 · Add the source files to the new target

1. In the Xcode Project Navigator, right-click the **ReadinessWidget** group
   Xcode created → **Add Files to "Readiness"…**
2. Navigate to `ios/ReadinessWidget/` and select all four files:
   - `ReadinessWidgetBundle.swift`
   - `WidgetData.swift`
   - `ReadinessProvider.swift`
   - `ReadinessWidget.swift`
3. In the "Add to targets" panel, make sure **only ReadinessWidget** is checked
   (not the main Readiness target).
4. Click **Add**.

---

## 4 · Add the native bridge files to the main target

1. In the Project Navigator, right-click the **Readiness** group → **Add Files…**
2. Navigate to `ios/ReadinessDataBridge/` and select:
   - `ReadinessDataBridge.swift`
   - `ReadinessDataBridge.m`
3. In "Add to targets", check **Readiness** only.
4. Click **Add**.

---

## 5 · Set the App Group entitlement on both targets

Xcode may already have read the entitlement files we updated, but verify:

1. Select the **Readiness** target → **Signing & Capabilities**.
2. Click **+ Capability** → **App Groups**.
3. Check `group.com.bobanilikj.readiness`.
4. Repeat for the **ReadinessWidget** target.

---

## 6 · Verify the widget builds

```bash
cd ios && xcodebuild -workspace Readiness.xcworkspace \
  -scheme ReadinessWidget \
  -destination 'generic/platform=iOS Simulator' \
  build | tail -5
```

You should see `BUILD SUCCEEDED`.

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

No network call needed — widget reads directly from shared local storage.
The widget also auto-refreshes every 30 minutes as a safety net.
