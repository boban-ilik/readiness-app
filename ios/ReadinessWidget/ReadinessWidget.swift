//
//  ReadinessWidget.swift
//  ReadinessWidget
//
//  Home-screen widget showing today's readiness score.
//  Matches the app's dark theme: near-black background, amber accent.
//

import SwiftUI
import WidgetKit

// ─── Theme ────────────────────────────────────────────────────────────────────

private enum Theme {
  static let bg        = Color(red: 0x0D / 255, green: 0x0F / 255, blue: 0x14 / 255)
  static let amber     = Color(red: 0xF5 / 255, green: 0xA6 / 255, blue: 0x23 / 255)
  static let secondary = Color.white.opacity(0.55)

  static func scoreColor(_ score: Int) -> Color {
    switch score {
    case 80...: return Color(red: 0x4A / 255, green: 0xD9 / 255, blue: 0x7B / 255) // green
    case 60...: return amber
    case 40...: return Color(red: 0xF2 / 255, green: 0x7D / 255, blue: 0x38 / 255) // orange
    default:    return Color(red: 0xE5 / 255, green: 0x48 / 255, blue: 0x4D / 255) // red
    }
  }
}

// ─── Score ring ───────────────────────────────────────────────────────────────

private struct ScoreRing: View {
  let score: Int
  var lineWidth: CGFloat = 8

  var body: some View {
    ZStack {
      Circle()
        .stroke(Color.white.opacity(0.08), lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: CGFloat(score) / 100)
        .stroke(
          Theme.scoreColor(score),
          style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
        )
        .rotationEffect(.degrees(-90))
    }
  }
}

// ─── Small widget ─────────────────────────────────────────────────────────────

private struct SmallView: View {
  let data: WidgetData

  var body: some View {
    ZStack {
      ScoreRing(score: data.score)
        .padding(6)
      VStack(spacing: 2) {
        Text("\(data.score)")
          .font(.system(size: 34, weight: .bold, design: .rounded))
          .foregroundColor(.white)
        Text(data.label.uppercased())
          .font(.system(size: 10, weight: .semibold))
          .tracking(1)
          .foregroundColor(Theme.scoreColor(data.score))
      }
    }
  }
}

// ─── Medium widget ────────────────────────────────────────────────────────────

private struct ComponentRow: View {
  let name:  String
  let value: Int

  var body: some View {
    HStack(spacing: 6) {
      Text(name)
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(Theme.secondary)
        .frame(width: 62, alignment: .leading)
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(Color.white.opacity(0.08))
          Capsule()
            .fill(Theme.scoreColor(value))
            .frame(width: geo.size.width * CGFloat(value) / 100)
        }
      }
      .frame(height: 5)
      Text("\(value)")
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundColor(.white)
        .frame(width: 22, alignment: .trailing)
    }
  }
}

private struct MediumView: View {
  let data: WidgetData

  var body: some View {
    HStack(spacing: 18) {
      ZStack {
        ScoreRing(score: data.score, lineWidth: 7)
        VStack(spacing: 1) {
          Text("\(data.score)")
            .font(.system(size: 28, weight: .bold, design: .rounded))
            .foregroundColor(.white)
          Text(data.label.uppercased())
            .font(.system(size: 8, weight: .semibold))
            .tracking(0.8)
            .foregroundColor(Theme.scoreColor(data.score))
        }
      }
      .frame(width: 92, height: 92)

      VStack(alignment: .leading, spacing: 9) {
        Text("READINESS")
          .font(.system(size: 10, weight: .bold))
          .tracking(1.5)
          .foregroundColor(Theme.amber)
        ComponentRow(name: "Recovery", value: data.recovery)
        ComponentRow(name: "Sleep",    value: data.sleep)
        ComponentRow(name: "Stress",   value: data.stress)
      }
    }
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

private struct EmptyView: View {
  var body: some View {
    VStack(spacing: 6) {
      Text("—")
        .font(.system(size: 30, weight: .bold, design: .rounded))
        .foregroundColor(Theme.secondary)
      Text("Open Readiness")
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(Theme.secondary)
    }
  }
}

// ─── Widget definition ────────────────────────────────────────────────────────

struct ReadinessWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ReadinessEntry

  var body: some View {
    Group {
      if let data = entry.data {
        switch family {
        case .systemMedium: MediumView(data: data)
        default:            SmallView(data: data)
        }
      } else {
        EmptyView()
      }
    }
    .containerBackground(Theme.bg, for: .widget)
  }
}

struct ReadinessWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "ReadinessWidget", provider: ReadinessProvider()) { entry in
      ReadinessWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Readiness Score")
    .description("Today's readiness score at a glance. Know before you go.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
