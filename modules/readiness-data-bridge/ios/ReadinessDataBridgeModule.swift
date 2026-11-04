import ExpoModulesCore
import WidgetKit

/// Writes today's readiness score to the shared App Group container so the
/// ReadinessWidget extension can render it without any network or database
/// access. Expo Module replacement for the old RCT_EXTERN_MODULE bridge.
public class ReadinessDataBridgeModule: Module {
  static let appGroupID = "group.com.bobanilikj.readiness"
  static let storageKey = "readiness.widget.data"

  public func definition() -> ModuleDefinition {
    Name("ReadinessDataBridge")

    // trainingZone 0 means rest; nil leaves the training call out.
    Function("writeScore") { (score: Int, label: String, recovery: Int, sleep: Int, stress: Int,
                             trainingHeadline: String?, trainingZone: Int?) in
      guard let defaults = UserDefaults(suiteName: Self.appGroupID) else { return }

      var payload: [String: Any] = [
        "score":     score,
        "label":     label,
        "recovery":  recovery,
        "sleep":     sleep,
        "stress":    stress,
        "updatedAt": Date().timeIntervalSince1970,
      ]
      if let trainingHeadline { payload["trainingHeadline"] = trainingHeadline }
      if let trainingZone     { payload["trainingZone"]     = trainingZone }

      guard let json = try? JSONSerialization.data(withJSONObject: payload) else { return }
      defaults.set(json, forKey: Self.storageKey)
      WidgetCenter.shared.reloadTimelines(ofKind: "ReadinessWidget")
    }
  }
}
