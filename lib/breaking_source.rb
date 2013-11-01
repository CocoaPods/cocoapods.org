# Require core library
require "middleman-core"

# We want all code blocks to have a full width white bg, and we don't want to have tag-heavy markdown
# so we pre-parse every page replacing the pre for a code block with the close / opening

module BreakingSource
  class << self

    def registered(app, options={})

      app.after_render do |body, path, locs, template_class|
        
        # we get multiple render calls due to markdown / slim doing their thing
        if (template_class.to_s.index "Slim") != nil or (path.to_s.index "templates") != nil            
          body
        else 
          pre = <<-eos      
    </article>
    </section>
  
    <div class="code-break">
    <section class="row container">
    <article class="content col-md-11 col-md-offset-1"><pre
          eos

          post = <<-eos
    </article>
    </section>
    </div>
  
    <section class="container row">
    <article class="content col-md-10 col-md-offset-1">
          eos
        
          body = body.gsub(/<pre/, pre)
          body = body.gsub(/<\/pre>/, "</pre>" + post)
        end
      end
    end
    alias :included :registered
  end
end

::Middleman::Extensions.register(:breaking_source) do
  ::BreakingSource
end