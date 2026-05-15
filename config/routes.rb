Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Static pages
  root "pages#home"
end
