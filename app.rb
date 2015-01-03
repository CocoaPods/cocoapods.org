require 'sinatra/base'
require 'json'
require 'slim'
require 'net/http'

class App < Sinatra::Base
  
  helpers do
    # Note: This is a hack that needs to be extracted into the
    # shared directory for comfortable inclusion. 
    #
    def shared_partial(source)
      slim :"../shared/includes/_#{source}"
    end
  end
  
  # Links to statically generated code.
  #
  set :public_folder, File.dirname(__FILE__) + '/middleman/build'
  
  # Explicitly redirect root to the main page.
  #
  get('/') do
    File.read File.join(settings.public_folder, 'index.html')
  end
  
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
  
  # Gets a Pod Page
  #
  get '/pod/:name' do
    results = metrics.where(pods[:name] => params[:name]).first
    
    if results    
      @pod_db = results.pod
      @metrics = results.github_pod_metric
      @cocoadocs = results.cocoadocs_pod_metric
      @cloc = cocoadocs_cloc_metrics.where(pod_id: @pod_db.id)
      
      version = pod_versions.where(pod_id: @pod_db.id).first
      commit = commits.where(pod_version_id: version.id).first
      @pod = JSON.parse(commit.specification_data)
      
      uri = URI(@cocoadocs["rendered_readme_url"])
      res = Net::HTTP.get_response(uri)
      @readme_html = res.body if res.is_a?(Net::HTTPSuccess)
      # @readme_html = File.read("/Users/orta/spiel/html/cocoadocs/activity/docsets/Realm/0.88.0/README.html")
     
      @content = slim :pod, :layout => false
      slim :pod_page
    else
      halt 404
    end
  end

  # TODO: DRY, lols.
  #
  get '/pod/:name/inline' do
    response['Access-Control-Allow-Origin'] = '*'
    
    results = metrics.where(pods[:name] => params[:name]).first
    
    if results    
      @pod_db = results.pod
      @metrics = results.github_pod_metric
      @cocoadocs = results.cocoadocs_pod_metric
      @cloc = cocoadocs_cloc_metrics.where(pod_id: @pod_db.id)
      
      version = pod_versions.where(pod_id: @pod_db.id).first
      commit = commits.where(pod_version_id: version.id).first
      @pod = JSON.parse(commit.specification_data)
      
      uri = URI(@cocoadocs["rendered_readme_url"])
      res = Net::HTTP.get_response(uri)
      @readme_html = res.body if res.is_a?(Net::HTTPSuccess)
      # @readme_html = File.read("/Users/orta/spiel/html/cocoadocs/activity/docsets/Realm/0.88.0/README.html")
     
      slim :pod, :layout => false
    else
      halt 404
    end
    
  end
  
  
  # Helper method that will give you a
  # joined pods/metrics query proxy.
  #
  def metrics
    pods.join(:github_pod_metrics).on(:id => :pod_id)
        .join(:cocoadocs_cloc_metrics).on(:id => :pod_id)
        .join(:cocoadocs_pod_metrics).on(:id => :pod_id)
  end
  
  
  # If it can't be found elsewhere, it's
  # probably an html file.
  # E.g. /about -> /about.html
  #
  get '/:filename' do
    File.read File.join(settings.public_folder, "#{params[:filename]}.html")
  end
  
end
