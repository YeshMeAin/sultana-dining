class ShopController < ApplicationController
  def index
    @categories = Category.ordered
    @current_category = params[:category].present? ? Category.find_by(id: params[:category]) : nil
    @items = @current_category ? @current_category.items : Item.all
    @items = @items.available.includes(:category, image_attachment: :blob).order(:name)
  end
end
