class Cart
  LineItem = Struct.new(:item, :quantity, :subtotal, keyword_init: true)

  attr_reader :items

  def initialize(session_hash = {})
    @items = (session_hash || {}).transform_values(&:to_i)
  end

  def add(item_id, qty = 1)
    key = item_id.to_s
    @items[key] = (@items[key] || 0) + qty
  end

  def set(item_id, qty)
    key = item_id.to_s
    qty <= 0 ? @items.delete(key) : @items[key] = qty
  end

  def remove(item_id)
    @items.delete(item_id.to_s)
  end

  def total_count
    @items.values.sum
  end

  def line_items
    return [] if @items.empty?

    records = Item.where(id: @items.keys).index_by { |i| i.id.to_s }
    @items.filter_map do |id, qty|
      item = records[id]
      next unless item
      LineItem.new(item: item, quantity: qty, subtotal: item.price * qty)
    end
  end

  def subtotal
    line_items.sum(&:subtotal)
  end

  def empty?
    @items.empty?
  end

  def to_h
    @items
  end
end
