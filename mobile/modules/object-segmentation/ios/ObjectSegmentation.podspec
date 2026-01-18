require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ObjectSegmentation'
  s.version        = package['version']
  s.summary        = package['description'] || 'Object segmentation for Object Organizer.'
  s.description    = package['description'] || s.summary
  s.license        = package['license'] || 'MIT'
  s.author         = package['author'] || 'Object Organizer'
  s.homepage       = package['homepage'] || 'https://example.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = ['Vision', 'UIKit', 'CoreImage']
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = "**/*.{h,m,swift}"
  s.swift_version = '5.9'
end
