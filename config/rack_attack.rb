require 'active_support'
require 'dalli'

def hourly_limit
  ENV['HOURLY_RATE_LIMIT'].try(:to_i) || 100
end

def memcache_host
  unless ENV.has_key? 'RATE_LIMIT_MEMCACHE_HOST'
    raise ArgumentError, 'RATE_LIMIT_MEMCACHE_HOST not set in environment' 
  end
  ENV['RATE_LIMIT_MEMCACHE_HOST']
end

options = { namespace: 'cocoapods', compress: true }
Rack::Attack.cache.store = Dalli::Client.new(memcache_host, options) 
# Always allow requests from localhost
# (blacklist & throttles are skipped)
Rack::Attack.whitelist('allow from localhost') do |req|
  # Requests are allowed if the return value is truthy
  '127.0.0.1' == req.ip || '::1' == req.ip
end

Rack::Attack.throttle('req/ip', limit: hourly_limit, period: 1.hour) do |req|
  req.ip if req.path.match(/\/pods\/.*/)
end

Rack::Attack.throttled_response = lambda do |env|
  # Using 503 because it may make attacker think that they have successfully
  # DOSed the site. Rack::Attack returns 429 for throttling by default
  [ 503, {}, []]
end
