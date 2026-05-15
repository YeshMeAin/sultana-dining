Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  scope "/:locale", locale: /en|he/ do
    get "/", to: "pages#home", as: :localized_root
  end

  root "pages#home"
end
