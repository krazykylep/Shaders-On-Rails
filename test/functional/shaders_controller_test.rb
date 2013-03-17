require 'test_helper'

class ShadersControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
  end

end
