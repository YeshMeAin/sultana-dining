class Category < ApplicationRecord
  has_many :items, dependent: :destroy

  validates :name, presence: true

  scope :ordered, -> { order(:position, :name) }
end
