require 'flounder'
require 'data_objects'

# Handle DB options.
#
options = {}
uri = DataObjects::URI::parse(ENV['DATABASE_URL'])
[:host, :port, :user, :password].each do |key|
  val = uri.send(key)
  options[key] = val if val
end
options[:dbname] = uri.path[1..-1]

# Connect.
#
connection = Flounder.connect options

# Set up pod domain.
#
DB = Flounder.domain connection do |dom|
  dom.entity :owners, :owner, 'owners'
  dom.entity :pods, :pod, 'pods'
end