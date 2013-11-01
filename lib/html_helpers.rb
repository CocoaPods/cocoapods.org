module HTMLHelpers

  # Converts a markdown string to HTML.
  #
  # @param [String] input
  #
  # @return [String] HTML
  #
  def markdown_h(input)
    @markdown_instance ||= Redcarpet::Markdown.new(Class.new(Redcarpet::Render::HTML) do
      def block_code(code, lang)
        lang ||= 'ruby'
        HTMLHelpers.syntax_highlight(code, :language => lang)
      end
    end, :autolink => true, :space_after_headers => true, :no_intra_emphasis => true)
    # TODO: experimental
    input = (input.slice(0,1).capitalize || '') + (input.slice(1..-1) || '')
    result = @markdown_instance.render(input)
  end

  # Capitalizes the firs letter of a string.
  #
  # @return [String]
  #
  def capitalize_first_letter(input)
    (input.slice(0,1).capitalize || '') + (input.slice(1..-1) || '')
  end

  # Highlights with Pigments the give string.
  #
  # @return [String]
  # @option [String] :language
  # @option [Fixnum] :line
  #         triggers line numbering.
  #
  def syntax_highlight(code, opts = {})
    HTMLHelpers.syntax_highlight(code, opts)
  end

  def self.syntax_highlight(code, opts = {})
    lexer = opts[:language] || 'ruby'
    py_options = { :encoding => 'utf-8' }

    if line = opts[:line]
      py_options[:linenos] = 'inline'
      py_options[:linenostart] = line
    end

    Pygments.highlight(code, :lexer => lexer, :options => py_options)
  end


end
