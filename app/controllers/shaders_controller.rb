class ShadersController < ApplicationController
  def index
    @user = session[:user] || nil
  end
end
