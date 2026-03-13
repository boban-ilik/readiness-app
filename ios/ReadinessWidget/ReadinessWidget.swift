import WidgetKit
import SwiftUI

// ─── Color helpers ────────────────────────────────────────────────────────────

private func scoreColor(_ score: Int) -> Color {
    switch score {
    case 81...: return Color(red: 0.26, green: 0.64, blue: 0.28) // optimal  #43A047
    case 61...: return Color(red: 0.49, green: 0.70, blue: 0.26) // good     #7CB342
    case 41...: return Color(red: 0.98, green: 0.55, blue: 0.00) // fair     #FB8C00
    case 21...: return Color(red: 0.96, green: 0.32, blue: 0.12) // poor     #F4511E
    default:    return Color(red: 0.90, green: 0.22, blue: 0.21) // critical #E53935
    }
}

private let bgColor = Color(red: 0.05, green: 0.06, blue: 0.08) // #0D0F14

// ─── Small widget (systemSmall) ───────────────────────────────────────────────

private struct SmallWidgetView: View {
    let entry: ReadinessEntry

    var body: some View {
        if let data = entry.widgetData {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 6)
                        .frame(width: 72, height: 72)
                    Circle()
                        .trim(from: 0, to: CGFloat(data.score) / 100.0)
                        .stroke(scoreColor(data.score),
                                style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .frame(width: 72, height: 72)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text("\(data.score)")
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text(data.label.uppercased())
                            .font(.system(size: 7, weight: .semibold))
                            .foregroundColor(scoreColor(data.score))
                    }
                }
                Text(friendlyDate(data.date))
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.white.opacity(0.5))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(12)
        } else {
            noDataView
        }
    }
}

// ─── Medium widget (systemMedium) ─────────────────────────────────────────────

private struct MediumWidgetView: View {
    let entry: ReadinessEntry

    var body: some View {
        if let data = entry.widgetData {
            HStack(spacing: 16) {
                // Ring
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 8)
                        .frame(width: 80, height: 80)
                    Circle()
                        .trim(from: 0, to: CGFloat(data.score) / 100.0)
                        .stroke(scoreColor(data.score),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 1) {
                        Text("\(data.score)")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text(data.label.uppercased())
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(scoreColor(data.score))
                    }
                }
                // Component bars
                VStack(alignment: .leading, spacing: 8) {
                    componentRow("💓", "Recovery", data.recovery)
                    componentRow("🌙", "Sleep",    data.sleep)
                    componentRow("🧠", "Stress",   data.stress)
                    Text(friendlyDate(data.date))
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.4))
                        .padding(.top, 2)
                }
                Spacer()
            }
            .padding(16)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            noDataView
        }
    }

    private func componentRow(_ icon: String, _ label: String, _ score: Int) -> some View {
        HStack(spacing: 6) {
            Text(icon).font(.system(size: 11))
            Text(label.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(.white.opacity(0.5))
                .frame(width: 60, alignment: .leading)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.08)).frame(height: 5)
                    Capsule()
                        .fill(scoreColor(score))
                        .frame(width: geo.size.width * CGFloat(score) / 100.0, height: 5)
                }
            }
            .frame(height: 5)
            Text("\(score)")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(.white.opacity(0.7))
                .frame(width: 22, alignment: .trailing)
        }
    }
}

// ─── No-data placeholder ──────────────────────────────────────────────────────

private var noDataView: some View {
    VStack(spacing: 8) {
        Text("🌙").font(.system(size: 28))
        Text("Open Readiness\nto sync your score")
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(.white.opacity(0.5))
            .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .padding(12)
}

// ─── Date helper ──────────────────────────────────────────────────────────────

private func friendlyDate(_ iso: String) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    guard let d = f.date(from: iso) else { return iso }
    if Calendar.current.isDateInToday(d)     { return "Today" }
    if Calendar.current.isDateInYesterday(d) { return "Yesterday" }
    let out = DateFormatter(); out.dateFormat = "EEE, MMM d"
    return out.string(from: d)
}

// ─── Widget definition ────────────────────────────────────────────────────────

struct ReadinessWidget: Widget {
    let kind = "ReadinessWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ReadinessProvider()) { entry in
            Group {
                MediumWidgetView(entry: entry)
            }
            .widgetBackground(bgColor)
        }
        .configurationDisplayName("Readiness Score")
        .description("Today's readiness score and recovery breakdown at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// ─── iOS 17 background compatibility shim ────────────────────────────────────

extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            background(color)
        }
    }
}

// ─── Preview ─────────────────────────────────────────────────────────────────

#Preview(as: .systemSmall) {
    ReadinessWidget()
} timeline: {
    ReadinessEntry(
        date: .now,
        widgetData: WidgetReadinessData(
            score: 78, label: "Good", date: "2026-03-10",
            recovery: 80, sleep: 72, stress: 68
        )
    )
}

#Preview(as: .systemMedium) {
    ReadinessWidget()
} timeline: {
    ReadinessEntry(
        date: .now,
        widgetData: WidgetReadinessData(
            score: 78, label: "Good", date: "2026-03-10",
            recovery: 80, sleep: 72, stress: 68
        )
    )
}
