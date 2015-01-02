desc "Initializes your working copy to have the correct submodules and gems"
task :bootstrap do
  puts "Updating submodules..."
  `git submodule update --init --recursive`

  puts "Installing gems"
  `bundle install`
  
  Bundler.with_clean_env do 
    sh "cd middleman && bundle install"
  end
end

desc 'Start up the dynamic site'
task :serve do
  sh "foreman start "
end

desc 'Build the static site'
task :build do
  sh "cd middleman && bundle exec middleman build"
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
    remote_db_url = `heroku config:get DATABASE_URL --app staging-cocoapods-org`.strip
    local_db_url = "postgres://localhost/trunk_cocoapods_org_development"
    sh "heroku pg:transfer --from #{local_db_url} --to #{remote_db_url} --confirm staging-cocoapods-org"
  end
end

