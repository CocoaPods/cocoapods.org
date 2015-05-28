require 'sinatra/base'
require 'json'
require 'slim'
require 'net/http'
require 'cocoapods-core'
require 'yaml'
require_relative 'spec_extensions'
require_relative 'lib/pod_quality_estimate'
require 'sprockets'
require 'set'
require 'digest/md5'

class App < Sinatra::Base
  configure do
    use Rack::Deflater
  end

  helpers do
    # Note: This is a hack that needs to be extracted into the
    # shared directory for comfortable inclusion.
    #
    def shared_partial(source)
      slim :"../shared/includes/_#{source}"
    end

    def partial(source)
      slim :"partials/_#{source}"
    end

    def data(name)
      YAML.load_file "data/#{name}.yaml"
    end
  end

  not_found do
    status 404
    slim :not_found
  end

  # Some special cases for the routing
  #

  get '/' do
    slim :index
  end

  get '/opensearch.xml' do
    content_type "application/xml"
    slim :opensearch, :layout => false
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
  get '/pods/:name' do
    STDOUT.sync = true
    result = metrics.where(pods[:deleted] => false, pods[:normalized_name] => params[:name].downcase).first
    unless result
      result = pods.where(pods[:deleted] => false, pods[:normalized_name] => params[:name].downcase).first
      halt 404, "404 - Pod not found" unless result
      
      # Support redirecting to the pods homepage if we can't do it.
      version = pod_versions.where(pod_id: result["id"]).sort_by { |v| Pod::Version.new(v.name) }.last
      commit = commits.where(pod_version_id: version.id, deleted_file_during_import: false).first
      pod = Pod::Specification.from_json commit.specification_data
      redirect pod.homepage
    end

    @page_title = "#{params[:name]} - CocoaPods.org"
    @content = pod_page_for_result result
    slim :pod_page
  end

  get '/pods/:name/inline' do
    response['Access-Control-Allow-Origin'] = '*'

    result = metrics.where(pods[:deleted] => false, pods[:name] => params[:name]).first
    halt 404, "404 - Pod not found" unless result

    pod_page_for_result result
  end
  
  get '/owners/:id' do
    @owner = owners.where(:id => params[:id]).first
    halt 404, "404 - Owner not found" unless @owner
        
    pod_ids = Set.new owners_pods.where(:owner_id => @owner[:id]).map do |owners_pod|
      owners_pod[:pod_id]
    end

    @pods = metrics.where(pods[:deleted] => false, pods[:id] => pod_ids).sort_by { |pod| pod[:github_pod_metric][:stargazers] || 0 }.reverse
    
    gravatar = Digest::MD5.hexdigest(@owner.email.downcase)
    @gravatar_url = "https://secure.gravatar.com/avatar/#{gravatar}.png?d=retro&r=PG&s=240"

    slim :owner
  end

  get '/pods/:name/quality' do
    @name = params[:name]
    @quality = PodQualityEstimate.load_quality_estimate(@name)
    slim :pod_quality
  end

  def pod_page_for_result result

    @pod_db = result.pod
    @metrics = result.github_pod_metric
    @cocoadocs = result.cocoadocs_pod_metric
    @version = pod_versions.where(pod_id: @pod_db.id).sort_by { |v| Pod::Version.new(v.name) }.last

    @commit = commits.where(pod_version_id: @version.id, deleted_file_during_import: false).order_by(:created_at.desc).first
    @pod = Pod::Specification.from_json @commit.specification_data
        
    uri = URI(@cocoadocs["rendered_readme_url"])
    res = Net::HTTP.get_response(uri)
    @readme_html = res.body.force_encoding('UTF-8') if res.is_a?(Net::HTTPSuccess)
    slim :pod, :layout => false
  end

  # Helper method that will give you a
  # joined pods/metrics query proxy.
  #
  def metrics
    pods.outer_join(:github_pod_metrics).on(:id => :pod_id).join(:cocoadocs_pod_metrics).on(:id => :pod_id)
  end

  # Setup assets.
  #
  sprockets = Sprockets::Environment.new
  
  # Generate an assets hash once on startup.
  #
  require 'securerandom'
  ASSETS_HASH = SecureRandom.hex
  
  add_asset_hash = ->(path) do
    head, dot, ext = path.rpartition('.')
    "#{head}-#{ASSETS_HASH}#{dot}#{ext}"
  end
  sprockets.context_class.class_eval do
    define_method :asset, &add_asset_hash
  end
  define_method :asset, &add_asset_hash
  define_method :deasset do |path|
    path.slice! "-#{ASSETS_HASH}"
    path
  end

  set :assets, sprockets
  
  # Configure sprockets
  ["img", "js", "fonts", "includes", "sass"].each do |shared|
    settings.assets.append_path "shared/#{shared}"
  end

  Dir["assets/*"].each do |file|
    settings.assets.append_path file
  end

  get "/javascripts/:file.js" do
    content_type "application/javascript"
    settings.assets["#{deasset(params[:file])}.js"]
  end

  get "/stylesheets/:file.css" do
    content_type "text/css"
    settings.assets["#{deasset(params[:file])}.css"]
  end

  get "/images/:file.svg" do
    content_type "image/svg+xml"
    settings.assets["#{deasset(params[:file])}.svg"]
  end

  get "/flashes/:file.swf" do
    content_type "application/x-shockwave-flash"
    settings.assets["#{deasset(params[:file])}.swf"]
  end

  ["images", "favicons"].each do |folder|
    get "/#{folder}/:file" do
      content_type "image/png"
      settings.assets["#{deasset(params[:file])}"]
    end
  end

  # If it can't be found elsewhere, it's
  # probably an html file.
  # E.g. /about -> /about.html
  #
  get '/:filename' do
    name = params[:filename]
    if File.exists? "views/#{name}.slim"
      slim :"#{name}"
    else
      halt 404
    end
  end
end
