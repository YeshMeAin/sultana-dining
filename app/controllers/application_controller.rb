class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  around_action :switch_locale

  def default_url_options
    { locale: I18n.locale == I18n.default_locale ? nil : I18n.locale }
  end

  helper_method :current_cart

  private

  def current_cart
    @current_cart ||= Cart.new(session[:cart])
  end

  def save_cart
    session[:cart] = current_cart.to_h
  end

  def switch_locale(&action)
    locale = params[:locale] || I18n.default_locale
    I18n.with_locale(locale, &action)
  end
end
