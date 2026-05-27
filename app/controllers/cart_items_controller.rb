class CartItemsController < ApplicationController
  def create
    @item = Item.find_by(id: params[:item_id])
    current_cart.add(params[:item_id])
    save_cart

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_back fallback_location: shop_path }
    end
  end

  def update
    @item = Item.find_by(id: params[:id])
    current_cart.set(params[:id], params[:quantity].to_i)
    save_cart

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_back fallback_location: shop_path }
    end
  end

  def destroy
    @item = Item.find_by(id: params[:id])
    current_cart.remove(params[:id])
    save_cart

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_back fallback_location: shop_path }
    end
  end
end
