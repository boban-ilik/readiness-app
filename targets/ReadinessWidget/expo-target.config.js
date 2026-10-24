/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
// The Readiness home and lock screen widget. Product name and bundle id
// match the pre-SDK-58 hand-managed target, so provisioning carries over.
module.exports = (config) => ({
  type: 'widget',
  name: 'ReadinessWidget',
  displayName: 'Readiness',
  bundleIdentifier: '.ReadinessWidget',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
