require 'sinatra/base'

class App < Sinatra::Base
  
  # Links to statically generated code.
  #
  set :public_folder, File.dirname(__FILE__) + '/middleman/build'
  
  
  # Methods for the dynamic part.
  #
  
  #
  #
  get '/pods/:name' do
    
  end
  
end
