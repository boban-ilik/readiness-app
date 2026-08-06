//
//  WidgetData.swift
//  ReadinessWidget
//
//  Shared data model + App Group storage reader.
//  The main app writes this JSON via ReadinessDataBridge.swift.
//

import Foundation

struct WidgetData: Codable {
  let score:     Int
  let label:     String
  let recovery:  Int
  let sleep:     Int
  let stress:    Int
  let updatedAt: TimeInterval

  var updatedDate: Date { Date(timeIntervalSince1970: updatedAt) }

  /// Sample used for placeholders and previews.
  static let sample = WidgetData(
    score: 78, label: "Good", recovery: 82, sleep: 74, stress: 71,
    updatedAt: Date().timeIntervalSince1970
  )
}

enum AppGroupStorage {
  static let appGroupID = "group.com.bobanilikj.readiness"
  static let storageKey = "readiness.widget.data"

  static func load() -> WidgetData? {
    guard
      let defaults = UserDefaults(suiteName: appGroupID),
      let json     = defaults.data(forKey: storageKey),
      let data     = try? JSONDecoder().decode(WidgetData.self, from: json)
    else { return nil }
    return data
  }
}
