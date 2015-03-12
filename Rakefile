desc "Initializes your working copy to have the correct submodules and gems"
task :bootstrap do
  puts "Updating submodules..."
  `git submodule update --init --recursive`

  puts "Installing gems"
  `bundle install`
  Rake::Task["build"].invoke
end

namespace :assets do
  desc "Compile the static site"
  task :precompile do
    Rake::Task["build"].invoke
  end
end

desc 'Build the static site'
task :build do
  Bundler.with_clean_env do 
    sh "cd middleman"
    sh "bundle install"
    sh "rake bootstrap"
    sh "rake generate"
    sh "rake build"
  end
end

desc "Deploy to heroku"
task :deploy do
  sh "git push heroku master "
end

desc "Deploy to orta's beta"
task :deploy_orta do
  sh "git push heroku_orta search_2:master "
end
