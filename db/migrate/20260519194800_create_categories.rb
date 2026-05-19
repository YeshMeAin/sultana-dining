class CreateCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :categories do |t|
      t.string :name, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end
  end
end
