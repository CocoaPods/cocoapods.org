require 'sinatra/base'
require 'json'
require 'slim'
require 'net/http'
require 'cocoapods-core'
require 'yaml'
require_relative 'spec_extensions'
require_relative 'lib/pod_quality_estimate'
require_relative 'lib/number_helper'
require 'sprockets'
require 'set'
require 'digest/md5'

# To support 2.6.5 - https://stackoverflow.com/questions/44053672/simple-rails-app-error-cannot-visit-integer
require 'arel'
module Arel
  module Visitors
    class DepthFirst < Arel::Visitors::Visitor
      alias :visit_Integer :terminal
    end

    class Dot < Arel::Visitors::Visitor
      alias :visit_Integer :visit_String
    end

    class ToSql < Arel::Visitors::Visitor
      alias :visit_Integer :literal
    end
  end
end

class App < Sinatra::Base
  
  configure do
    use Rack::Deflater
  end
  include NumberHelper
  I18n.config.available_locales = 'en-GB'

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

    def quality_indicator_svg
      @quality_indicator_svg ||= File.read('assets/images/pod.svg')
    end

    def quality_indicator_group input
      input >= 100 ? "5" : (input / 20) + 1
    end
  end

  not_found do
    status 404
    slim :not_found
  end

  # Some special cases for the routing
  #

  get '/pods/LLDebugTool' do
    # remove this if the cache-control seems to work
    halt 403, "DDOS protection"
  end

  get '/' do
    dynamic_content_cache_headers
    slim :index
  end

  get '/get-started' do
    static_content_cache_headers
    redirect "https://github.com/cocoapods/cocoapods/issues?q=is%3Aopen+is%3Aissue+label%3Ad1%3Aeasy"
  end

  get '/opensearch.xml' do
    static_content_cache_headers
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
  get '/pods/:name/?' do
    dynamic_content_cache_headers

    STDOUT.sync = true
    result = metrics.where(pods[:deleted] => false, pods[:normalized_name] => params[:name].downcase).first
    unless result
      result = pods.where(pods[:deleted] => false, pods[:normalized_name] => params[:name].downcase).first
      halt 404, "404 - Pod not found" unless result

      # Support redirecting to the pods homepage if we can't do it.
      version = pod_versions.where(pod_id: result["id"], deleted: false).sort_by { |v| Pod::Version.new(v.name) }.last
      commit = commits.where(pod_version_id: version.id, deleted_file_during_import: false).first
      pod = Pod::Specification.from_json commit.specification_data
      redirect pod.homepage
    end

    @content = pod_page_for_result result
    slim :pod_page
  end

  get '/pods/:name/inline' do
    dynamic_content_cache_headers
    response['Access-Control-Allow-Origin'] = '*'

    result = metrics.where(pods[:deleted] => false, pods[:name] => params[:name]).first
    halt 404, "404 - Pod not found" unless result

    pod_page_for_result result
  end

  get '/pods/:name/changelog' do
    dynamic_content_cache_headers
    response['Access-Control-Allow-Origin'] = '*'

    result = metrics.where(pods[:deleted] => false, pods[:name] => params[:name]).first
    halt 404, "404 - Pod not found" unless result

    changelog_url = result.cocoadocs_pod_metric["rendered_changelog_url"]
    halt 404, "404 - Pod does not have an associated CHANGELOG" unless changelog_url

    res = Net::HTTP.get_response(URI(changelog_url))
    return res.body.force_encoding('UTF-8') if res.is_a?(Net::HTTPSuccess)
    halt 404, "404 - CHANGELOG not found at #{changelog_url}"
  end

  get '/owners/:id' do
    dynamic_content_cache_headers
    @owner = owners.where(:id => params[:id]).first
    halt 404, "404 - Owner not found" unless @owner

    pod_ids = Set.new owners_pods.where(:owner_id => @owner[:id]).map do |owners_pod|
      owners_pod[:pod_id]
    end

    # all_dbs = metrics.join(:stats_metrics).on(:id => :pod_id)
    @pods = metrics.where(pods[:deleted] => false, pods[:id] => pod_ids).sort_by { |pod| pod[:name].downcase }

    gravatar = Digest::MD5.hexdigest(@owner.email.downcase)
    @gravatar_url = "https://secure.gravatar.com/avatar/#{gravatar}.png?d=retro&r=PG&s=240"
    @page_title = "#{@owner[:name]}'s account on CocoaPods.org"
    @page_description = "#{@pods.length} pods by #{@owner[:name]}."
    slim :owner
  end

  get '/pods/:name/quality' do
    static_content_cache_headers
    not_found
  end

  def pod_page_for_result result

    @pod_db = result.pod
    @metrics = localize_numbers(result.github_pod_metric.to_h,
                                %(stargazers subscribers forks open_issues contributors open_pull_requests))
    @cocoadocs = localize_numbers(result.cocoadocs_pod_metric.to_h,
                                  %(install_size total_files total_lines_of_code))
    @stats = localize_numbers(stats_metrics.where(pod_id: @pod_db.id).first.to_h,
                          %w(download_total download_week download_month app_total app_week
                             pod_try_total pod_try_week tests_total tests_week extensions_total
                             extensions_week watch_total watch_week))
    @version = pod_versions.where(pod_id: @pod_db.id, deleted: false).sort_by { |v| Pod::Version.new(v.name) }.last
    @owners = owners_pods.join(:owners).on(:owner_id => :id).where(pod_id: @pod_db.id).to_a
    @commit = commits.where(pod_version_id: @version.id, deleted_file_during_import: false).order_by(:created_at.desc).first
    @pod = Pod::Specification.from_json @commit.specification_data
    @page_title = "#{@pod.name} on CocoaPods.org"
    @page_description = @pod.summary
    uri = URI(@cocoadocs["rendered_readme_url"])
    res = Net::HTTP.get_response(uri)
    @readme_html = res.body.force_encoding('UTF-8') if res.is_a?(Net::HTTPSuccess)
    # @readme_html = ""
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
  unless environment == :development
    sprockets.js_compressor  = :uglify
    sprockets.css_compressor = :scss
  end

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

  def dynamic_content_cache_headers
    # you have to set some `Cache-Control` to actually have cache hits on CDN
    # using 20 secs client-side and 60 secs server-side
    cache_control :public, max_age: 20, s_maxage: 60
  end

  def static_content_cache_headers
    cache_control :public, :must_revalidated, max_age: 60 * 60 * 24 * 31 * 2
  end

  get "/javascripts/:file.js" do
    static_content_cache_headers
    content_type "application/javascript"
    settings.assets["#{deasset(params[:file])}.js"]
  end

  get "/stylesheets/:file.css" do
    static_content_cache_headers
    content_type "text/css"
    settings.assets["#{deasset(params[:file])}.css"]
  end

  get "/images/:file.svg" do
    static_content_cache_headers
    content_type "image/svg+xml"
    settings.assets["#{deasset(params[:file])}.svg"]
  end

  get "/flashes/:file.swf" do
    static_content_cache_headers
    content_type "application/x-shockwave-flash"
    settings.assets["#{deasset(params[:file])}.swf"]
  end

  ["images", "favicons"].each do |folder|
    get "/#{folder}/:file" do
      static_content_cache_headers
      content_type "image/png"
      settings.assets["#{deasset(params[:file])}"]
    end
  end

  # If it can't be found elsewhere, it's
  # probably represented by a slim file.
  # E.g. /about -> /about.slim
  #
  get '/:filename' do
    dynamic_content_cache_headers
    name = params[:filename]
    if File.exists? "views/#{name}.slim"
      slim :"#{name}"
    else
      halt 404
    end
  end
end
