require 'middleman-gh-pages'
require 'JSON'
require 'yaml'
require "octokit"
require "twitter"

task :deploy do
  Rake::Task["publish"].invoke
end

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
  
  # loop through all projects getting a list of contributors 
  ["CocoaPods", "Core", "Xcodeproj", "CLAide"].each do |project|
    p "Getting #{project}"
    
    data_path = "data/contributors_#{project.downcase}.yaml"
    `rm #{data_path}` if File.exists? data_path
    
    # this is just an empty github app that does nothing
    Octokit.client_id = '927bff412ce93e98de3e'
    Octokit.client_secret = '6cb0186380b3b3301709345593a5580aadbf636f'
    Octokit.auto_paginate = true
    
    # grab contributors
    contributors = Octokit.collabs "CocoaPods/#{project}"

    # Store a simpler model of the data
    yaml_data = []
    contributors.each do |contributor|
      yaml_data << {
        :name => contributor.login,
        :gravatar_id => contributor.gravatar_id
      }
    end

    # put it in a middleman data yaml file
    File.open(data_path, "w") do |out|
       YAML.dump(yaml_data, out)
    end
  end
  
end
