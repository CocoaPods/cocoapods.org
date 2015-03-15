require 'sinatra/base'
require 'json'
require 'slim'
require 'net/http'
require 'cocoapods-core'
require 'yaml'
require_relative 'spec_extensions'
require 'sprockets'

class App < Sinatra::Base

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

    result = metrics.where(pods[:name] => params[:name]).first
    halt 404, "404 - Pod not found" unless result

    @content = pod_page_for_result result
    slim :pod_page
  end

  get '/pods/:name/inline' do
    response['Access-Control-Allow-Origin'] = '*'

    result = metrics.where(pods[:name] => params[:name]).first
    halt 404, "404 - Pod not found" unless result

    pod_page_for_result result
  end

  def pod_page_for_result result

    @pod_db = result.pod
    @metrics = result.github_pod_metric
    @cocoadocs = result.cocoadocs_pod_metric
    # @cloc = cocoadocs_cloc_metrics.where(pod_id: @pod_db.id)

    @version = pod_versions
                .where(pod_id: @pod_db.id)
                .sort_by { |v| Pod::Version.new(v.name) }
                .last

    @commit = commits.where(pod_version_id: @version.id).first
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
    pods.join(:github_pod_metrics).on(:id => :pod_id)
        .join(:cocoadocs_pod_metrics).on(:id => :pod_id)
  end

  # Setup image assets
  #

  set :assets, Sprockets::Environment.new

  # Configure sprockets
  settings.assets.append_path "shared/img"
  settings.assets.append_path "shared/js"
  settings.assets.append_path "shared/fonts"
  settings.assets.append_path "shared/includes"
  settings.assets.append_path "shared/sass"

  Dir["assets/*"].each do |file|
    settings.assets.append_path file
  end

  get "/javascripts/:file.js" do
    content_type "application/javascript"
    settings.assets["#{params[:file]}.js"]
  end

  get "/stylesheets/:file.css" do
    content_type "text/css"
    settings.assets["#{params[:file]}.css"]
  end

  get "/images/:file.svg" do
    content_type "image/svg+xml"
    settings.assets["#{params[:file]}.svg"]
  end

  get "/images/:file" do
    settings.assets[params[:file]]
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
      File.read File.join(settings.public_folder, "#{name}.html")
    end
  end

end
