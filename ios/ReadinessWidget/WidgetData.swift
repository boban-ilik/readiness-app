import Foundation

// ─── Shared data model ────────────────────────────────────────────────────────
// Written by the app via ReadinessDataBridge, read by the widget timeline
// provider. Uses App Group UserDefaults for IPC.

struct WidgetReadinessData: Codable {
    let score:     Int
    let label:     String       // "Excellent", "Good", "Fair", "Low", "Very Low"
    let date:      String       // "YYYY-MM-DD"
    let recovery:  Int
    let sleep:     Int
    let stress:    Int
}

enum AppGroupStorage {
    static let suiteName = "group.com.bobanilikj.readiness"
    static let dataKey   = "readiness_widget_data"

    static func load() -> WidgetReadinessData? {
        guard
            let defaults = UserDefaults(suiteName: suiteName),
            let jsonData = defaults.data(forKey: dataKey)
        else { return nil }
        return try? JSONDecoder().decode(WidgetReadinessData.self, from: jsonData)
    }

    static func save(_ data: WidgetReadinessData) {
        guard
            let defaults = UserDefaults(suiteName: suiteName),
            let jsonData = try? JSONEncoder().encode(data)
        else { return }
        defaults.set(jsonData, forKey: dataKey)
    }
}
