class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.string :name, null: false
      t.text :description
      t.decimal :price, precision: 8, scale: 2, null: false
      t.references :category, null: false, foreign_key: true
      t.boolean :available, default: true, null: false

      t.timestamps
    end
  end
end
