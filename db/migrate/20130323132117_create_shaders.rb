class CreateShaders < ActiveRecord::Migration
  def change
    create_table :shaders do |t|
      t.string :title
      t.string :author
      t.text :image
      t.text :code
      t.integer :width
      t.integer :height

      t.timestamps
    end
  end
end
