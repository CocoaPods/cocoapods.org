require 'sinatra/base'
require 'json'

class App < Sinatra::Base
  
  # Links to statically generated code.
  #
  set :public_folder, File.dirname(__FILE__) + '/middleman/build'
  
  # Explicitly redirect root to the main page.
  #
  get('/') { redirect 'index.html' }
  
  # Set up dynamic part.
  #
  require_relative 'domain'
  
  # Methods for the dynamic part.
  #
  DB.entities.each do |entity|
    name = entity.plural
    define_method name do
      DB[name]
    end
  end
  
  #
  #
  get '/pods/:name' do
    results = metrics.
      where(pods[:name] => params[:name]).
      first
    
    results.to_json
  end
  
  # Helper method that will give you a
  # joined pods/metrics query proxy.
  #
  def metrics
    pods.join(:github_pod_metrics).on(:id => :pod_id)
  end
  
end
