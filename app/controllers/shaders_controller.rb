class ShadersController < ApplicationController
  def index
    @user = session[:user] || nil
  end

  def new
    shaderData = {
      title: params[:title],
      author: params[:author],
      width: params[:width],
      height: params[:height],
      image: params[:image],
      code: params[:code]
    }

    shader = Shader.new(shaderData)

    if session[:user]
      user = User.find(session[:user][:user_id])
      shader.user = user if user
    end

    saved = shader.save

    if saved
      render :json => {:message => 'Saved!'}
    else
      render :json => {:error => 'Could not save shader!'}
    end

  end

  def get
    offset = params[:offset]
    number = params[:number].to_i || 16;
    number = [[number, 16].min, 1].max

    shaders = Shader.limit(number).offset(offset).reverse_order
    render :json => shaders
  end
end
