module Pod
  module Doc

    # Generators generate the static data used by the static website builder
    # (the Middleman).
    #
    # The data is serialized in a YAML file that contains the representation of
    # the CodeObjects classes. These classes are intended to be dumb.
    #
    module Generators

      # The base Generator is an abstract class that provides support for
      # concrete subclass.  It generates a YAML file suited for building static
      # sites.
      #
      # A generator describes a single YARD Object.
      #
      class Base

        require 'html_helpers'
        include ::HTMLHelpers

        # @param  [String, Array<String>] source_files
        #         The source files that contains the comments providing the
        #         docs.
        #
        def initialize(source_files)
          require 'yard'
          require 'redcarpet'
          require 'pygments'
          require 'active_support/core_ext/string/inflections'
          require 'active_support/core_ext/array/conversions'

          source_files = [source_files] unless source_files.is_a?(Array)
          @source_files = source_files
        end

        # @return [Array<String>] The source files of the generator.
        #
        attr_reader :source_files

        # @return [String] The name of the generator. Subclasses use it find
        #         the root YARD object.
        #
        attr_accessor :name

        # @return [String] The output file where the generator should be saved.
        #
        attr_accessor :output_file

        #---------------------------------------------------------------------#

        # @return [CodeObjects::Base]
        #
        def generate
          puts "\e[1;32mGenerating #{output_file}\e[0m"
          generate_code_object
        end

        # @return [CodeObjects::Base]
        #
        def generate_code_object
        end

        # Generates and saves the code object in YAML format to the specified
        # output file.
        #
        # @return [void]
        #
        def save
          require 'yaml'
          File.open(output_file, 'w') { |f| f.puts(generate.to_yaml) }
        end

        #---------------------------------------------------------------------#

        private

        # @return [YARD::Registry] The yard registry initialized with the
        #         source files for this generator.
        #
        def yard_registry
          return @yard_registry if @yard_registry
          YARD::Registry.clear
          raise 'Yard registry not clean' unless YARD::Registry.all.count.zero?
          YARD::Registry.load(source_files, true)
          @yard_registry = YARD::Registry
        end


      end

      require 'doc/generators/commands'
      require 'doc/generators/dsl'
      require 'doc/generators/gem'

    end
  end
end
