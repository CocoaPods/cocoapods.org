require 'tilt'
require 'slim'

# Require core library
require "middleman-core"
require "middleman-core/core_extensions"

# Essentially a way of getting partials from the shared folder
# TODO:there may be a more native way of doing this in middleman using partials?

module SharedLayouts
  class << self

    def registered(app, options={})
      app.helpers LayoutTagHelper
      $APP = app
    end
    alias :included :registered
    
  end
end

module LayoutTagHelper
  
  def shared_layout(*sources)
    
    current_dir = File.dirname(File.expand_path(__FILE__))
    shared_include = current_dir + "/../shared/includes/" + sources.first + ".slim"

    template = Tilt::new shared_include
    template.render($APP , :guides => true )
  end
end

::Middleman::Extensions.register(:shared_layouts) do
  ::SharedLayouts
end