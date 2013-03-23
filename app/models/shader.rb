class Shader < ActiveRecord::Base
  attr_accessible :author, :code, :height, :image, :title, :width

  belongs_to :user
end
