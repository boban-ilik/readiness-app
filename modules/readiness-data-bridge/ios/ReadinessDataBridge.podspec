Pod::Spec.new do |s|
  s.name           = 'ReadinessDataBridge'
  s.version        = '1.0.0'
  s.summary        = 'Writes today\'s score to the App Group for the widget'
  s.description    = 'Expo Module used by Readiness to hand the score to its WidgetKit extension'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
