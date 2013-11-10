require 'middleman-gh-pages'
require 'httparty'
require 'JSON'

task :deploy do
  Rake::Task["publish"].invoke
end

task :generate do
  
  # loop through all projects getting a list of major contributors for the about
  
  blacklist = ["alloy", "irrationalfab", "orta"]
  ["Specs", "CocoaPods", "Core", "Xcodeproj", "CLAide"].each do |project|
    response = HTTParty.get "http://github.com/CocoaPods/#{project}/graphs/contributors-data"
    response.each do |person|
      p person["author"]
    end    
  end
  
end