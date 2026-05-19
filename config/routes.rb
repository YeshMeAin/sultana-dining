Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  scope "/:locale", locale: /en|he/ do
    get "/", to: "pages#home", as: :localized_root
    get "/shop", to: "shop#index", as: :localized_shop
  end

  get "/shop", to: "shop#index", as: :shop
  root "pages#home"
end
