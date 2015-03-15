require 'bundler/setup'

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

$:.unshift File.expand_path('..', __FILE__)
require 'app'

run App
