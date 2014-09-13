require 'sinatra/base'

class App < Sinatra::Base
  
  # Links to statically generated code.
  #
  set :public_folder, File.dirname(__FILE__) + '/middleman/build'
  
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
    
  end
  
end
