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
    STDOUT.sync = true
    
    result = metrics.where(pods[:name] => params[:name]).first    
    halt 404, "404" unless result

    @content = pod_page_for_result result
    slim :pod_page
  end

  get '/pod/:name/inline' do
    response['Access-Control-Allow-Origin'] = '*'
    
    result = metrics.where(pods[:name] => params[:name]).first
    halt 404, "404" unless result
    
    pod_page_for_result result
  end
  
  def pod_page_for_result result
    
    @pod_db = result.pod
    @metrics = result.github_pod_metric
    @cocoadocs = result.cocoadocs_pod_metric
    # @cloc = cocoadocs_cloc_metrics.where(pod_id: @pod_db.id)
    
    version = pod_versions.where(pod_id: @pod_db.id).first

    # use this, somehow:
    <<-eos
    
    select id,
           name,
           v[1] as major_version,
           v[2] as minor_version,
           v[3] as patch_level
    from (
       select id, 
              name, 
              string_to_array(name, '.') as v
       from pod_versions
    ) t
    order by
        CASE WHEN v[1]~E'^\\d+$' THEN v[1]::int ELSE 0 END desc,
        CASE WHEN v[2]~E'^\\d+$' THEN v[2]::int ELSE 0 END desc,
        CASE WHEN v[3]~E'^\\d+$' THEN v[3]::int ELSE 0 END desc;
    
    eos
    
    commit = commits.where(pod_version_id: version.id).first
    @pod = JSON.parse(commit.specification_data)
    

    # if ENV['RACK_ENV'] == "development"
    #   @readme_html = File.read "/Users/orta/spiel/html/Strata/cocoadocs.org/activity/readme/ORStackView/2.0.0/index.html"
    # else
      uri = URI(@cocoadocs["rendered_readme_url"])
      res = Net::HTTP.get_response(uri)
      @readme_html = res.body if res.is_a?(Net::HTTPSuccess)
    # end
    
    slim :pod, :layout => false
  end
  
  
  # Helper method that will give you a
  # joined pods/metrics query proxy.
  #
  def metrics
    pods.join(:github_pod_metrics).on(:id => :pod_id)
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
