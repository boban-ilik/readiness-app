//
//  ReadinessDataBridge.swift
//  Readiness
//
//  React Native module that writes today's readiness score to the shared
//  App Group container so the ReadinessWidget extension can render it
//  without any network or database access.
//

import Foundation
import WidgetKit

@objc(ReadinessDataBridge)
class ReadinessDataBridge: NSObject {

  static let appGroupID = "group.com.bobanilikj.readiness"
  static let storageKey = "readiness.widget.data"

  @objc static func requiresMainQueueSetup() -> Bool { false }

  /// Original method, kept so older JS bundles keep working.
  @objc(writeScore:label:recovery:sleep:stress:)
  func writeScore(
    _ score:  NSNumber,
    label:    NSString,
    recovery: NSNumber,
    sleep:    NSNumber,
    stress:   NSNumber
  ) {
    write(score: score, label: label, recovery: recovery, sleep: sleep, stress: stress,
          trainingHeadline: nil, trainingZone: nil)
  }

  /// Same as writeScore plus today's training call (zone 0 means rest).
  @objc(writeScoreWithTraining:label:recovery:sleep:stress:trainingHeadline:trainingZone:)
  func writeScoreWithTraining(
    _ score:          NSNumber,
    label:            NSString,
    recovery:         NSNumber,
    sleep:            NSNumber,
    stress:           NSNumber,
    trainingHeadline: NSString,
    trainingZone:     NSNumber
  ) {
    write(score: score, label: label, recovery: recovery, sleep: sleep, stress: stress,
          trainingHeadline: trainingHeadline as String, trainingZone: trainingZone.intValue)
  }

  private func write(
    score:            NSNumber,
    label:            NSString,
    recovery:         NSNumber,
    sleep:            NSNumber,
    stress:           NSNumber,
    trainingHeadline: String?,
    trainingZone:     Int?
  ) {
    guard let defaults = UserDefaults(suiteName: Self.appGroupID) else { return }

    var payload: [String: Any] = [
      "score":     score.intValue,
      "label":     label as String,
      "recovery":  recovery.intValue,
      "sleep":     sleep.intValue,
      "stress":    stress.intValue,
      "updatedAt": Date().timeIntervalSince1970,
    ]
    if let trainingHeadline { payload["trainingHeadline"] = trainingHeadline }
    if let trainingZone     { payload["trainingZone"]     = trainingZone }

    guard let json = try? JSONSerialization.data(withJSONObject: payload) else { return }
    defaults.set(json, forKey: Self.storageKey)

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "ReadinessWidget")
    }
  }
}
