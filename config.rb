require "lib/shared_layouts.rb"

set :encoding, 'utf-8'
set :relative_links, true

# Support for browsing from the build folder.
set :strip_index_file,  false

configure :build do
  activate :sprockets
  activate :minify_javascript
  activate :minify_css
  activate :relative_assets
end

set :markdown, :tables => true, :autolink => true, :gh_blockcode => true, :fenced_code_blocks => true, :with_toc_data => true
set :markdown_engine, :redcarpet

activate :automatic_image_sizes
activate :rouge_syntax

activate :shared_layouts

configure :development do
  activate :livereload
end

# Allow shared assets folder to not be in source, thereby not dragging in every asset
after_configuration do
  sprockets.append_path "../shared/img"
  sprockets.append_path "../shared/js"
  sprockets.append_path "../shared/fonts"
  sprockets.append_path "../shared/includes"
  sprockets.append_path "../shared/sass"
end