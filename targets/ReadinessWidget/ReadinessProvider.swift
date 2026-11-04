//
//  ReadinessProvider.swift
//  ReadinessWidget
//
//  TimelineProvider that reads the latest score from App Group storage.
//  The app pushes updates on every score computation; the 30-minute
//  timeline refresh is only a safety net.
//

import WidgetKit

struct ReadinessEntry: TimelineEntry {
  let date: Date
  let data: WidgetData?
}

struct ReadinessProvider: TimelineProvider {
  func placeholder(in context: Context) -> ReadinessEntry {
    ReadinessEntry(date: .now, data: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (ReadinessEntry) -> Void) {
    let data = context.isPreview ? .sample : AppGroupStorage.load()
    completion(ReadinessEntry(date: .now, data: data ?? .sample))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ReadinessEntry>) -> Void) {
    let entry   = ReadinessEntry(date: .now, data: AppGroupStorage.load())
    let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
    completion(Timeline(entries: [entry], policy: .after(refresh)))
  }
}
