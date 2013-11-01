module Pod
  module Doc
    module Generators

      class Gem < Base

        # @param [Pathname] gem_spec_file
        #
        def initialize(gem_spec_file)
          require 'rubygems'
          @gem_spec_file = Pathname.new(gem_spec_file)
          gem_dir = File.dirname(gem_spec_file)
          Dir.chdir(gem_dir) do
            @specification = ::Gem::Specification.load(gem_spec_file.to_s)
          end
          gem_files = @specification.files.map { |file| "#{gem_dir}/#{file}" }
          source_files = gem_files.select { |f| f.end_with?('.rb') }
          super(source_files)
        end

        # @return [Pathname] the path of the specification.
        #
        attr_reader :gem_spec_file

        # @return [Gem::Specification] the specification for the gem.
        #
        attr_reader :specification

        # @return [String] The GitHub name of the repo.
        #
        attr_accessor :github_name

        #---------------------------------------------------------------------#

        # @return [Doc::CodeObjects::Gem] the code object for this generator.
        #
        def generate_code_object
          gem             = Doc::CodeObjects::Gem.new
          gem.name        = name
          gem.github_name = github_name
          gem.version     = specification.version.to_s
          gem.authors     = specification.authors.to_sentence
          gem.description = specification.description
          gem.name_spaces = generate_name_spaces(yard_registry, gem)
          gem
        end

        # @return [Array<Doc::CodeObjects::NameSpace>]
        #
        # http://rubydoc.info/docs/yard/YARD/CodeObjects/ModuleObject
        # http://rubydoc.info/docs/yard/YARD/CodeObjects/ClassObject
        #
        def generate_name_spaces(yard_registry, gem)
          yard_name_spaces = yard_registry.all(:class, :module).sort_by(&:to_s)
          name_spaces = yard_name_spaces.map do |yard_name_space|
            puts "  - #{yard_name_space.name}"
            name_space             = Doc::CodeObjects::NameSpace.new
            name_space.name        = yard_name_space.name
            name_space.gem         = gem
            name_space.full_name   = yard_name_space.to_s
            name_space.visibility  = yard_name_space.visibility
            name_space.groups      = generate_groups(yard_name_space, name_space)
            name_space.html_description = markdown_h(yard_name_space.docstring.to_s)

            if yard_name_space.is_a?(YARD::CodeObjects::ClassObject)
              name_space.is_class  = true
              # name_space.inherited_constants = yard_name_space.inherited_constants
              name_space.is_exception        = yard_name_space.is_exception?
              name_space.superclass          = yard_name_space.superclass.to_s
            end
            name_space
          end
          set_name_spaces_parents(name_spaces, gem)
          name_spaces
        end

        # @return [void] Sets the parent name_space of each name_space.
        #
        # @note   The Gem is set as the parent for root name_spaces.
        #
        def set_name_spaces_parents(name_spaces, gem)
          name_spaces.each do |name_space|
            segments = name_space.full_name.split('::')
            if segments.count == 1 || segments.first == "Gem"
              name_space.parent = gem
            else
              parent = name_spaces.find { |ns| ns.full_name == segments[0..-2] * '::' }
              raise "Unable to find a parent for #{name_space.full_name}" unless parent
              name_space.parent = parent
            end
          end
        end

        # @return [Array<Doc::CodeObjects::Group>] generates the groups for the
        #         given name_space.
        #
        # @note   The order of the methods determines the order of the groups.
        #
        def generate_groups(yard_name_space, name_space)
          yard_groups = yard_name_space.meths.map(&:group).uniq.compact
          groups = yard_groups.map do |yard_group|
            group = Doc::CodeObjects::Group.new
            group.parent           = name_space
            group.name             = yard_group.lines.first.chomp if yard_group && !yard_group.lines.count.zero?
            group.html_description = markdown_h(yard_group.lines.drop(1).join) if yard_group
            group.meths = []
            group
          end
          generate_methods(yard_name_space, name_space, groups)
          # groups = groups.reject { |g| }
          # groups.each do |group|
          #   raise "Empty group `#{group.name}` for #{name_space.name}" if group.meths.empty?
          # end
          groups
        end

        # @return [void]
        #
        # Groups attributes and aliases.
        #
        def generate_methods(yard_name_space, name_space, groups)
          methods_by_name = yard_name_space.meths.group_by do |yard_method|
            yard_method.name.to_s.gsub('=','')
          end

          methods = []
          methods_by_name.each do |name, yard_methods|
            method                  = Doc::CodeObjects::GemMethod.new
            # Preserve `=` sign
            method.name             = yard_methods.count == 1 ? yard_methods.first.name : name
            method.parent           = name_space

            rep_yard_method = yard_methods.first
            method.group            = groups.find { |g| g.name == ((rep_yard_method.group.nil? || rep_yard_method.group.lines.first.nil?) ? nil : rep_yard_method.group.lines.first.chomp) }
            unless method.group
              puts "[!!!] Missing group for method #{name} with name `#{rep_yard_method.group ? rep_yard_method.group.lines.first.chomp : 'nil'}`" 
              return nil
            end
            method.group.meths ||= []
            method.group.meths << method

            method.scope            = rep_yard_method.scope
            method.visibility       = rep_yard_method.visibility
            method.is_attribute     = rep_yard_method.is_attribute?
            method.html_source      = syntax_highlight(rep_yard_method.source, :line => rep_yard_method.line)
            method.source_files     = rep_yard_method.files.map { |f| [f[0].gsub(/^.*\/lib\//,'lib/'), f[1]] }
            method.spec_files       = find_spec_files(method.source_files)
            method.html_todos       = rep_yard_method.tags('todo').map { |t| markdown_h(t.text) }
            method.html_notes       = rep_yard_method.tags('note').map { |t| markdown_h(t.text) }

            signatures = yard_methods.map do |yard_method|
              signature = Doc::CodeObjects::GemMethod::GemMethodSignature.new
              signature.html_description = markdown_h(yard_method.docstring.to_s)
              signature.html_name        = compute_method_signature(yard_method)
              signature.parameters       = compute_method_parameters(yard_method, :param)
              signature.returns          = compute_method_parameters(yard_method, :return)
              signature.examples         = compute_method_examples(yard_method)
              signature.aliases = yard_method.aliases.map(&:to_s)
              signature
            end
            method.signatures = signatures

            if method.is_attribute
              method.attr_type = if !yard_methods.any?(&:reader?)
               'attribute writer'
              elsif !yard_methods.any?(&:writer?)
               'attribute reader'
              else
               'readwrite attribute'
              end
            end

            if yard_name_space.is_a?(YARD::CodeObjects::ClassObject)
              method.inherited = yard_methods.any? { |yard_method| yard_name_space.inherited_meths.include?(yard_method) }
            end
            methods << method
          end

          # group.meths            = yard_method.map { |m| generate_method(m, yard_name_space, name_space) }
          # group.meths.each { |method| method.group = group }
          # group attributes
          # methods_by_group = yard_name_space.meths.group_by
          # methods_by_name.grou_by
        end

        #---------------------------------------------------------------------#

        # @return [Array<String>] the spec files associated with the given
        #         source files.
        #
        def find_spec_files(source_files)
          spec_dir = gem_spec_file + '../spec'
          source_files.map do |source_file|
            name =  File.basename(source_file[0], '.rb')
            files = Dir.glob(spec_dir + "**/#{name}_spec.rb")
            files.map { |f| f.gsub(/^.*\/spec\//,'spec/') }
          end.flatten.compact
        end

        # @return [Array<CodeObjects::Example>] The list of the examples of the
        #         method.
        #
        # @note   In this context the name of the tag is used as the
        #         description.
        #
        def compute_method_examples(yard_method)
          r = yard_method.docstring.tags(:example).map do |e|
            CodeObjects::Example.new(e.name, syntax_highlight(e.text.strip))
          end
          r  unless r.empty?
        end

        # TODO This method ignores the `@overload` tag.
        #
        def compute_method_parameters(yard_method, tag_name)
          result = yard_method.docstring.tags(tag_name).map do |tag|
            param = CodeObjects::Param.new
            param.name  = tag.name
            if tag.types
              param.types = tag.types
            else
              warn "  [WARN] Missing types for tag #{tag.name} of method #{yard_method.name}"
            end
            if tag.text
              param.html  = markdown_h(tag.text.strip)
            else
              warn "  [WARN] Missing text for tag #{tag.name} of method #{yard_method.name}"
            end
            param
          end
          result unless result.empty?
        end

        # Adapted from YARD
        #
        def compute_method_signature(yard_method)
          if yard_method.tags(:overload).size == 1
            syntax_highlight(signature(yard_method.tag(:overload), false))
          elsif yard_method.tags(:overload).size > 1
            yard_method.tags(:overload).each do |overload|
              syntax_highlight(signature(overload, false))
            end
          else
            syntax_highlight(signature(yard_method, false))
          end
        end

        #---------------------------------------------------------------------#

        # @!group YARD Helpers
        #
        # In this group the helpers from YARD are adapted.

        require 'yard'
        include YARD::Templates::Helpers::BaseHelper
        include YARD::Templates::Helpers::HtmlHelper
        include YARD::Templates::Helpers::MethodHelper

        def options
          @options ||= YARD::Templates::TemplateOptions.new
        end

        # @see lib/yard/templates/helpers/html_helper.rb:468
        def signature(meth, link = true, show_extras = true, full_attr_name = true)
          args = format_args(meth)
          name = meth.name
          type = signature_types(meth, false)
          type = 'undefined' if type.empty?
          "#{name}#{args} #=> #{type}"

        end

        # @see lib/yard/templates/helpers/html_helper.rb:415
        def format_types(typelist, brackets = true)
          return 'undefined' if typelist.empty?
          return typelist unless typelist.is_a?(Array)
          typelist.join(", ")
        end

        def signature_types(meth, link = true)
          r = super
          r.gsub!(/[\(\)]/, '')
          r
        end

        # @see lib/yard/helpers/method_helper.rb:6
        def format_args(object)
          return if object.parameters.nil?
          params = object.parameters
          if object.has_tag?(:yield) || object.has_tag?(:yieldparam)
            params.reject! do |param|
              param[0].to_s[0,1] == "&" &&
                !object.tags(:param).any? {|t| t.name == param[0][1..-1] }
            end
          end

          unless params.empty?
            args = params.map {|n, v| v ? "#{n} = #{v}" : n.to_s }.join(", ")
            "(#{args})"
          else
            ""
          end
        end

        #---------------------------------------------------------------------#

        def format_constant(value)
          sp = value.split("\n").last[/^(\s+)/, 1]
          num = sp ? sp.size : 0
          html_syntax_highlight value.gsub(/^\s{#{num}}/, '')
        end

        #---------------------------------------------------------------------#

      end
    end
  end
end
