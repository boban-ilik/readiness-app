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

  // Added later: optional so JSON written by older app builds still decodes.
  let trainingHeadline: String?
  let trainingZone:     Int?      // 0 means rest

  var updatedDate: Date { Date(timeIntervalSince1970: updatedAt) }

  /// "Z3", or "Rest" for zone 0. Nil when the app didn't send a zone.
  /// "Z3". Nil for rest days: the headline ("Rest Today") already says it.
  var trainingZoneText: String? {
    guard let zone = trainingZone, zone > 0 else { return nil }
    return "Z\(zone)"
  }

  /// "Steady Training Day · Z3". Nil when there is no training call.
  var trainingLine: String? {
    guard let headline = trainingHeadline, !headline.isEmpty else { return nil }
    guard let zone = trainingZoneText else { return headline }
    return "\(headline) · \(zone)"
  }

  /// Sample used for placeholders and previews.
  static let sample = WidgetData(
    score: 78, label: "Good to Go", recovery: 82, sleep: 74, stress: 71,
    updatedAt: Date().timeIntervalSince1970,
    trainingHeadline: "Strong Workout Day", trainingZone: 4
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
