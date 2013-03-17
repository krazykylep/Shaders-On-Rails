require 'cgi'
require 'uri'
require 'net/http'
require 'net/https'
require 'json'

class SessionsController < ApplicationController
  def login
    token = params[:token]
    if (token && token.length == 40)
      url = URI.parse("https://rpxnow.com/api/v2/auth_info")

      # Needs to make a https request with ssl.
      https = Net::HTTP.new(url.host, url.port)
      https.use_ssl = true
      https.ca_file = File.join(File.dirname(__FILE__), '..', '..', 'config', 'ssl_cert.pem')
      https.verify_mode = OpenSSL::SSL::VERIFY_PEER
      https.verify_depth = 5

      query = {
        token: token,
        apiKey: ENGAGE_API_KEY,
        format: 'json'
      }

      # make query string to POST to the engage api.
      data = query.map { |k,v|
        "#{CGI::escape k.to_s}=#{CGI::escape v.to_s}"
      }.join('&')

      resp = https.post(url.path, data)

      if resp.code == '200'
        begin
          allData = JSON.parse(resp.body)
          if allData['stat'] != 'ok'
            render :json => {:error => 'Unexpected API error'}
            return
          end

          userData = {
            identifier: allData['profile']['identifier'],
            name: allData['profile']['displayName'],
            email: allData['profile']['email']
          }
        rescue JSON::ParserError => err
          render :json => {:error => 'Unable to parse JSON response'}
          return
        end
      else
        render :json => {:error => "Unexpected HTTP status code from server: #{resp.code}"}
        return
      end

      # Try to find the user based on the email first in case they logged in with
      # a different provider this time that has the same email as their first time provider.
      user = makeHashFromUser(User.where(:email => userData[:email]).limit(1))
      if user
        session[:user] = user
      else
        user = User.where(:identifier => userData[:identifier]).limit(1)
        if user.length == 0
          user = User.new(userData)
          user.save
          session[:user] = userData
        else
          session[:user] = makeHashFromUser(user)
        end
      end
      render :json => user
      return
    else
      render :json => {:error => 'Incorrect or no access token.'}
      return
    end
  end

  def logout
    session[:user] = nil
    redirect_to(root_url, notice: 'You have logged out')
  end

  private

  def makeHashFromUser(user)
    if (user.length > 0)
      user = user[0]
      return {
        :identifier => user.identifier,
        :name => user.name,
        :email => user.email
      }
    else
      return nil
    end
  end
end
