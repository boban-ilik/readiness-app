//
//  ReadinessWidget.swift
//  ReadinessWidget
//
//  Home-screen and lock-screen widget showing today's readiness score.
//  Home screen matches the app's dark theme: near-black background, amber accent.
//  Lock screen (accessory families) is monochrome-safe: no reliance on colour.
//

import SwiftUI
import WidgetKit

// ─── Theme ────────────────────────────────────────────────────────────────────

private enum Theme {
  static let bg        = Color(red: 0x0D / 255, green: 0x0F / 255, blue: 0x14 / 255)
  static let amber     = Color(red: 0xF5 / 255, green: 0xA6 / 255, blue: 0x23 / 255)
  static let secondary = Color.white.opacity(0.55)

  /// Same bands as getScoreColor in src/constants/theme.ts.
  static func scoreColor(_ score: Int) -> Color {
    switch score {
    case ...20: return Color(red: 0xE5 / 255, green: 0x39 / 255, blue: 0x35 / 255) // critical
    case ...40: return Color(red: 0xF4 / 255, green: 0x51 / 255, blue: 0x1E / 255) // poor
    case ...60: return Color(red: 0xFB / 255, green: 0x8C / 255, blue: 0x00 / 255) // fair
    case ...80: return Color(red: 0x7C / 255, green: 0xB3 / 255, blue: 0x42 / 255) // good
    default:    return Color(red: 0x43 / 255, green: 0xA0 / 255, blue: 0x47 / 255) // optimal
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

      VStack(alignment: .leading, spacing: data.trainingLine == nil ? 9 : 7) {
        Text("READINESS")
          .font(.system(size: 10, weight: .bold))
          .tracking(1.5)
          .foregroundColor(Theme.amber)
        ComponentRow(name: "Recovery", value: data.recovery)
        ComponentRow(name: "Sleep",    value: data.sleep)
        ComponentRow(name: "Stress",   value: data.stress)
        if let headline = data.trainingHeadline, !headline.isEmpty {
          HStack(spacing: 4) {
            Text(headline)
              .font(.system(size: 11, weight: .semibold))
              .foregroundColor(.white)
            if let zone = data.trainingZoneText {
              Text("· \(zone)")
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundColor(Theme.secondary)
            }
          }
          .lineLimit(1)
          .minimumScaleFactor(0.8)
        }
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

// ─── Lock screen: circular ────────────────────────────────────────────────────

private struct CircularView: View {
  @Environment(\.widgetRenderingMode) private var renderingMode
  let data: WidgetData?

  var body: some View {
    if let data {
      Gauge(value: Double(min(max(data.score, 0), 100)), in: 0...100) {
        Text("Readiness")
      } currentValueLabel: {
        Text("\(data.score)")
          .font(.system(.title3, design: .rounded).weight(.bold))
      }
      .gaugeStyle(.accessoryCircularCapacity)
      // Colour only where the system shows it; vibrant/accented stay monochrome.
      .tint(renderingMode == .fullColor ? Theme.scoreColor(data.score) : nil)
      .widgetAccentable()
    } else {
      ZStack {
        AccessoryWidgetBackground()
        Text("—")
          .font(.system(.title3, design: .rounded).weight(.bold))
      }
    }
  }
}

// ─── Lock screen: rectangular ─────────────────────────────────────────────────

private struct RectangularView: View {
  let data: WidgetData?

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      if let data {
        Text("\(data.score) · \(data.label)")
          .font(.system(.headline, design: .rounded))
          .widgetAccentable()
        if let line = data.trainingLine {
          Text(line)
            .font(.system(.subheadline))
            .foregroundStyle(.secondary)
        }
      } else {
        Text("—")
          .font(.system(.headline, design: .rounded))
          .widgetAccentable()
        Text("Open Readiness")
          .font(.system(.subheadline))
          .foregroundStyle(.secondary)
      }
    }
    .lineLimit(1)
    .minimumScaleFactor(0.8)
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

// ─── Lock screen: inline ──────────────────────────────────────────────────────

private struct InlineView: View {
  let data: WidgetData?

  var body: some View {
    if let data {
      Text("Readiness \(data.score) · \(data.label)")
    } else {
      Text("— · Open Readiness")
    }
  }
}

// ─── Widget definition ────────────────────────────────────────────────────────

struct ReadinessWidgetEntryView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ReadinessEntry

  var body: some View {
    switch family {
    case .accessoryCircular, .accessoryRectangular, .accessoryInline:
      // Lock screen: the system draws the backdrop; declare a clear container
      // background so iOS 17 doesn't show the "adopt containerBackground" placeholder.
      accessoryContent
        .containerBackground(for: .widget) { Color.clear }
    default:
      homeContent
        .containerBackground(Theme.bg, for: .widget)
    }
  }

  @ViewBuilder private var accessoryContent: some View {
    switch family {
    case .accessoryCircular:    CircularView(data: entry.data)
    case .accessoryRectangular: RectangularView(data: entry.data)
    default:                    InlineView(data: entry.data)
    }
  }

  @ViewBuilder private var homeContent: some View {
    if let data = entry.data {
      switch family {
      case .systemMedium: MediumView(data: data)
      default:            SmallView(data: data)
      }
    } else {
      EmptyView()
    }
  }
}

struct ReadinessWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "ReadinessWidget", provider: ReadinessProvider()) { entry in
      ReadinessWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Readiness Score")
    .description("Today's readiness score at a glance. Know before you go.")
    .supportedFamilies([
      .systemSmall, .systemMedium,
      .accessoryCircular, .accessoryRectangular, .accessoryInline,
    ])
  }
}
