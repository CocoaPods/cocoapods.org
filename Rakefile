desc "Initializes your working copy to have the correct submodules and gems"
task :bootstrap do
  puts "Updating submodules..."
  `git submodule update --init --recursive`

  puts "Installing gems"
  `bundle install`
    sh "cd middleman && bundle install"
end

desc 'Build the static site'
task :build do
  sh "cd middleman && bundle exec middleman build"
end

desc "Deploy to heroku"
task :deploy do
  sh "git push heroku master "
end

desc "Deploy to orta's beta"
task :deploy_orta do
  sh "git push heroku_orta search_2:master "
end
