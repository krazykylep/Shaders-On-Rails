class AddUserForeignKeyToShader < ActiveRecord::Migration
  def change
    add_column :shaders, :user_id, :integer
    add_index :shaders, :user_id
  end
end
