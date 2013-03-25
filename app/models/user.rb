class User < ActiveRecord::Base
  attr_accessible :email, :identifier, :name

  validates :identifier, :presence => true, :uniqueness => true
  validates :email, :presence => true, :uniqueness => true

  has_many :Shaders
end
