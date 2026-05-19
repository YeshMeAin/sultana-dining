Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  scope "/:locale", locale: /en|he/ do
    get "/", to: "pages#home", as: :localized_root
    get "/shop", to: "shop#index", as: :localized_shop
    resources :cart_items, only: [:create, :update, :destroy], as: :localized_cart_items
  end

  get "/shop", to: "shop#index", as: :shop
  resources :cart_items, only: [:create, :update, :destroy]
  root "pages#home"
end
