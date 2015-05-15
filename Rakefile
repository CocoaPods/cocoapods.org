desc "Initializes your working copy to have the correct submodules and gems"
task :bootstrap do
  puts "Updating submodules..."
  `git submodule update --init --recursive`

  puts "Installing gems..."
  `bundle install`
end

begin

require 'json'
require 'yaml'
Bundler.require

desc 'Start up the dynamic site'
task :serve do
  sh "foreman start"
end

desc "Deploy to heroku"
task :deploy do
  sh "git push heroku master "
end

desc "Deploy to staging"
task :deploy_staging do
  branch = `git rev-parse --abbrev-ref HEAD`.strip
  sh "git push heroku_staging #{branch}:master"
end

desc "Deploy current dev database"
task :deploy_staging_db do
  Bundler.with_clean_env do
    sh "git add ."
    sh "git commit -m 'build static'"
    remote_db_url = `heroku config:get DATABASE_URL --app staging-cocoapods-org`.strip
    local_db_url = "postgres://localhost/trunk_cocoapods_org_development"
    sh "heroku pg:transfer --from #{local_db_url} --to #{remote_db_url} --confirm staging-cocoapods-org"
  end
end

desc 'Starts a interactive console with the db env loaded'
task :console do
  exec({"RACK_ENV" => "development"}, "pry -I #{File.expand_path('../', __FILE__)} -r domain -e 'DB.entities.each do |entity|;name = entity.plural;define_method name do DB[name] end end'")
end

desc "Generate dev team and contributor infos for the about page."
task :generate do
  puts("Generating dev team from Twitter")
  Rake::Task["generate_team"].invoke

  puts("Generating contributors from Github")
  Rake::Task["generate_contributors"].invoke
end

task :generate_team do

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

  ["team", "alumni"].each do |team_name|
    yaml_data = []
    deactivated = %w(andyrmyers kattrali)

    team = YAML.load_file("data/raw_" + team_name + '.yaml')
    team.each do |member|
      next if deactivated.include? member["twitter_username"]
      puts("Getting #{ member["twitter_username"] }")

      twitter_user = client.user member["twitter_username"]
      member["twitter_profile_url"] = twitter_user.profile_image_uri_https.to_s.gsub("_normal", "")
      member["twitter_banner_url"] = twitter_user.profile_banner_uri.to_s

      yaml_data << member
    end

    if team_name == "alumni"
      yaml_data << {
        "name" => "Delisa Mason",
        "cocoapods_bio" => "Toolsmith lvl 99.",
        "twitter_profile_url" => "https://pbs.twimg.com/profile_images/542803639316664320/Jzcs814D.png",
        "twitter_banner_url" => "http://pbs.twimg.com/profile_banners/40614452/1386607496/web",
      }
      yaml_data << {
        "name" => "Andy Myers",
        "cocoapods_bio" => "Really doing the design.",
        "twitter_profile_url" => "https://pbs.twimg.com/profile_images/415145378627862528/TDAPjav-.jpeg",
        "twitter_banner_url" => "http://pbs.twimg.com/profile_banners/15503664/1387813885/web",
      }
    end

    File.open("data/#{ team_name }.yaml", "w") do |out|
      YAML.dump(yaml_data, out)
    end

  end
end

task :generate_contributors do
  class Commiter
    attr_accessor :commits, :avatar_url, :name
    def to_hash
      Hash[instance_variables.map { |var| [var[1..-1].to_sym, instance_variable_get(var)] }]
    end
  end

  def download_list(url)
    # Downloads a list of objects from the URL using `Link` header to paginate
    response = REST.get(url)
    return [] if response.status_code == 204
    items = JSON.parse(response.body)

    if link = response.headers['link']
      link_header = LinkHeader.parse(link.join)
      next_url = link_header.find_link(['rel', 'next'])
      items += download_list(next_url.href) if next_url
    end

    items
  end

  params = "?client_id=927bff412ce93e98de3e&client_secret=6cb0186380b3b3301709345593a5580aadbf636f"
  repos = download_list('https://api.github.com/orgs/CocoaPods/repos' + params)
  all_contributors = []

  # loop through all projects getting a list of contributors
  repos.each do |repo|
    project = repo["name"]
    next if project == "Specs"

    puts "Getting #{project}"

    # grab the stats
    contributors = download_list("https://api.github.com/repos/CocoaPods/#{project}/contributors" + params)

    puts "- Found " + contributors.count.to_s + " contributors."

    contributors.each do |contributor|
      name = contributor['login']
      existing = all_contributors.detect { |e| e.name == name }

      if existing
        existing.commits += contributor['contributions']
      else
        commiter = Commiter.new
        commiter.name = name
        commiter.commits = contributor['contributions']
        commiter.avatar_url = contributor['avatar_url']
        all_contributors << commiter
      end
    end

    # double check uniques, and order
    contributors = all_contributors.uniq { |hash| hash.name }.sort_by { |hash| [-hash.commits, hash.name.downcase] }

    # save as hashes for ease of use in middleman
    contributors = contributors.map { |s| s.to_hash }

    File.open("data/contributors.yaml", "w") do |out|
      YAML.dump(contributors, out)
    end
  end
end

rescue LoadError, NameError => e
  $stderr.puts "\033[0;31m" \
    '[!] Some Rake tasks haven been disabled because the environment' \
    ' couldn’t be loaded. Be sure to run `rake bootstrap` first or use the ' \
    "VERBOSE environment variable to see errors.\e[0m"
  if ENV['VERBOSE']
    $stderr.puts e.message
    $stderr.puts e.backtrace
    $stderr.puts
  end
end
