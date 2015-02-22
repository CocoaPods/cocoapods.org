require 'sinatra/base'
require 'json'
require 'slim'
require 'net/http'
require 'cocoapods-core'
require_relative 'spec_extensions'

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

    version = pod_versions
                .where(pod_id: @pod_db.id)
                .sort_by { |v| Pod::Version.new(v.name) }
                .last

    @commit = commits.where(pod_version_id: version.id).first
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


  # If it can't be found elsewhere, it's
  # probably an html file.
  # E.g. /about -> /about.html
  #
  get '/:filename' do
    File.read File.join(settings.public_folder, "#{params[:filename]}.html")
  end

end
