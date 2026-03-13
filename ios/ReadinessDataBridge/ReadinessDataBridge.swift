import Foundation
import WidgetKit

/// Writes today's readiness score to the shared App Group so the
/// WidgetKit extension can display it without a network call.
///
/// Called from JS via NativeModules.ReadinessDataBridge.writeScore(...)
@objc(ReadinessDataBridge)
class ReadinessDataBridge: NSObject {

    private let suiteName = "group.com.bobanilikj.readiness"
    private let dataKey   = "readiness_widget_data"

    @objc
    func writeScore(
        _ score:    NSNumber,
        label:      String,
        recovery:   NSNumber,
        sleep:      NSNumber,
        stress:     NSNumber
    ) {
        guard let defaults = UserDefaults(suiteName: suiteName) else { return }

        let today: String = {
            let f        = DateFormatter()
            f.dateFormat = "yyyy-MM-dd"
            return f.string(from: Date())
        }()

        let payload: [String: Any] = [
            "score":    score.intValue,
            "label":    label,
            "date":     today,
            "recovery": recovery.intValue,
            "sleep":    sleep.intValue,
            "stress":   stress.intValue,
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: payload) else { return }
        defaults.set(data, forKey: dataKey)

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "ReadinessWidget")
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool { false }
}
