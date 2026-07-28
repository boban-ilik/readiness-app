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

  @objc(writeScore:label:recovery:sleep:stress:)
  func writeScore(
    _ score:  NSNumber,
    label:    NSString,
    recovery: NSNumber,
    sleep:    NSNumber,
    stress:   NSNumber
  ) {
    guard let defaults = UserDefaults(suiteName: Self.appGroupID) else { return }

    let payload: [String: Any] = [
      "score":     score.intValue,
      "label":     label as String,
      "recovery":  recovery.intValue,
      "sleep":     sleep.intValue,
      "stress":    stress.intValue,
      "updatedAt": Date().timeIntervalSince1970,
    ]

    guard let json = try? JSONSerialization.data(withJSONObject: payload) else { return }
    defaults.set(json, forKey: Self.storageKey)

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "ReadinessWidget")
    }
  }
}
