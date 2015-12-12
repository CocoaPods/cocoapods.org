require 'active_support'
require 'dalli'

def hourly_limit
  ENV['HOURLY_RATE_LIMIT'].try(:to_i) || 100
end

def memcache_host
  unless ENV.has_key? 'MEMCACHEDCLOUD_USERNAME'
    raise ArgumentError, 'MEMCACHEDCLOUD_USERNAME not set in environment'
  end
  ENV['MEMCACHEDCLOUD_USERNAME']
end

options = { :namespace => 'cocoapods', :compress => true }
memcache_servers = { :username => memcache_host, :password => ENV["MEMCACHEDCLOUD_PASSWORD"] }
Rack::Attack.cache.store = Dalli::Client.new(ENV["MEMCACHEDCLOUD_SERVERS"].split(','), options.merge(memcache_servers) )

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
