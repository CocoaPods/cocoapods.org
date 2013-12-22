desc "Initializes your working copy to have the correct submodules and gems"
task :bootstrap do
  puts "Updating submodules..."
  `git submodule update --init --recursive`

  puts "Installing gems"
  `bundle install`
end

require 'middleman-gh-pages'
require 'JSON'
require 'yaml'
require "twitter"

task :deploy do
  Rake::Task["publish"].invoke
end

desc 'Runs the web server locally and watches for changes'
task :run do
  sh "middleman server --port 4567"
end

desc "Generate dev team and contributor infos for the about page."
task :generate do
  p "Generating dev team from Twitter"
  Rake::Task["generate_team"].invoke

  p "Generating contributors from Github"
  Rake::Task["generate_contributors"].invoke
end

task :generate_team do
  yaml_data = []
  
  # This is for an account @123123wqeqweqqwe
  # so I'm not worried if people try break in.
  
  # Think this is rate limited to 15 calls every 15 minutes
  # so don't generate twice in a row ;)
  
  client = Twitter::REST::Client.new do |config|
    config.consumer_key        = "1QaLPhCqKhOeji8WW7Rgrg"
    config.consumer_secret     = "dvnLGIP7rOMlM4FkLYECY08VPT0L6afsZTjhEfcw"
    config.access_token        = "2232249636-4bqvbKfGwBsEsU78vSvnpk1JA6Zs8RKRtP466CF"
    config.access_token_secret = "jcjML9tG93Nh76IyxzesejOXIostnbfri7iyDPlk6hCU5"
  end
  
  team = YAML.load_file('team.yaml')
  team.each do |member| 
    p "Getting #{ member["twitter_username"] }"
    
    twitter_user = client.user member["twitter_username"]
    
    member[:twitter_profile_url] = twitter_user.profile_image_uri_https.to_s.gsub("_normal", "")
    member[:twitter_banner_url] = twitter_user.profile_banner_uri.to_s
    
    yaml_data << member
  end
  
  File.open("data/dev_team.yaml", "w") do |out|
     YAML.dump(yaml_data, out)
  end
end

task :generate_contributors do
  require 'rest'
  require 'json'
  
  class Commiter
    attr_accessor :commits, :gravatar_id, :name
    def to_hash
      Hash[instance_variables.map { |var| [var[1..-1].to_sym, instance_variable_get(var)] }]
    end
  end
  
  params = "?client_id=927bff412ce93e98de3e&client_secret=6cb0186380b3b3301709345593a5580aadbf636f" 
  response = RestClient.get("https://api.github.com/orgs/CocoaPods/repos" + params)
  repos = JSON.parse(response.body)
  all_contributors = []
  
  # loop through all projects getting a list of contributors 
  repos.each do |repo|
    project = repo["name"]
    next if project == "Specs" 
  
    p "Getting #{project}"
  
    # grab the stats
    url = "https://api.github.com/repos/CocoaPods/#{project}/stats/contributors" + params
    response = RestClient.get(url)
    next if response.code != 200
    
    contributors = JSON.parse(response.body)
    p "Found " + contributors.count.to_s + " contributors."
  
    contributors.each do |contributor|
      name = contributor["author"]["login"]
      existing = all_contributors.detect { |e| e.name == name }
      if existing 
        existing.commits += contributor["total"]

      else
        commiter = Commiter.new
        commiter.name = name
        commiter.commits = contributor["total"]
        commiter.gravatar_id = contributor["author"]["gravatar_id"]
        all_contributors << commiter
      end
    end
  
    # double check uniquea, and order
    contributors = all_contributors.uniq{ |hash| hash.name }.sort_by { |hash| hash.commits }.reverse

    # save as hashes for ease of use in middleman
    contributors = contributors.map { |s| s.to_hash }
    
    File.open("data/contributors.yaml", "w") do |out|
      YAML.dump(contributors, out)
    end
  end
end
