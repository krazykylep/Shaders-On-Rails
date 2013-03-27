class ChangeImageToLongText < ActiveRecord::Migration
  def change
    change_column :shaders, :image, :text, :limit => 400000
  end
end
