import WidgetKit
import SwiftUI

// ─── Timeline Entry ───────────────────────────────────────────────────────────

struct ReadinessEntry: TimelineEntry {
    let date:       Date
    let widgetData: WidgetReadinessData?
}

// ─── Timeline Provider ────────────────────────────────────────────────────────

struct ReadinessProvider: TimelineProvider {

    // Placeholder shown while widget slot is first loading (blurred preview)
    func placeholder(in context: Context) -> ReadinessEntry {
        ReadinessEntry(
            date: Date(),
            widgetData: WidgetReadinessData(
                score: 72, label: "Good", date: todayString(),
                recovery: 75, sleep: 70, stress: 65
            )
        )
    }

    // Snapshot used in the widget gallery
    func getSnapshot(in context: Context, completion: @escaping (ReadinessEntry) -> Void) {
        let data = AppGroupStorage.load()
        completion(ReadinessEntry(date: Date(), widgetData: data))
    }

    // Live timeline — refresh every 30 min so the widget stays fresh
    // if the user backgrounds the app after syncing.
    func getTimeline(in context: Context, completion: @escaping (Timeline<ReadinessEntry>) -> Void) {
        let data    = AppGroupStorage.load()
        let entry   = ReadinessEntry(date: Date(), widgetData: data)

        // Refresh in 30 minutes; the app will also call
        // WidgetCenter.shared.reloadAllTimelines() when a new score is computed.
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refresh))
        completion(timeline)
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private func todayString() -> String {
        let f         = DateFormatter()
        f.dateFormat  = "yyyy-MM-dd"
        return f.string(from: Date())
    }
}
