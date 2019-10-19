require 'bundler/setup'

require 'rack/attack'
require_relative 'config/rack_attack'

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

$:.unshift File.expand_path('..', __FILE__)
require 'app'

use Rack::Attack
run App
