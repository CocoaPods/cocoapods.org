require 'active_support'

module NumberHelper
  def localize_numbers(hash, keys)
    Hash[hash.keys.map do |key|
      value = hash[key]
      if keys.include? key.to_s
        value = ActiveSupport::NumberHelper.number_to_delimited(value, locale: 'en-GB')
      end

      [key.to_s, value]
    end]
  end
end
