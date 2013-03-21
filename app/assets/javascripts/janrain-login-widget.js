(function() {
  if (typeof window.janrain !== 'object') window.janrain = {};
  if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};

  /* _______________ can edit below this line _______________ */

  janrain.settings.tokenUrl = 'http://localhost:3000/login';
  janrain.settings.type = 'modal';
  janrain.settings.appId = 'egjabeoepkmekffhmopb';
  janrain.settings.appUrl = 'https://kylepaulsen.rpxnow.com';
  janrain.settings.providers = ["google","facebook"];
  janrain.settings.providersPerPage = '4';
  janrain.settings.format = 'two column';
  janrain.settings.actionText = 'Sign in ';
  janrain.settings.showAttribution = true;
  janrain.settings.fontColor = '#666666';
  janrain.settings.fontFamily = 'lucida grande, Helvetica, Verdana, sans-serif';
  janrain.settings.backgroundColor = '#f7fdff';
  janrain.settings.width = '392';
  janrain.settings.modalBorderColor = '#000000';
  janrain.settings.modalBorderRadius = '10';
  janrain.settings.modalBorderWidth = '10';
  janrain.settings.modalBorderOpacity = '0.5';
  janrain.settings.buttonBorderColor = '#CCCCCC';
  janrain.settings.buttonBorderRadius = '5';
  janrain.settings.buttonBackgroundStyle = 'gradient';
  janrain.settings.language = 'en';
  janrain.settings.linkClass = 'janrainEngage';

  // ======== Optional client side auth setting: ========== //
  janrain.settings.tokenAction='event';

  /* _______________ can edit above this line _______________ */

  function isReady() { janrain.ready = true; };
  if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", isReady, false);
  } else {
    window.attachEvent('onload', isReady);
  }

  var e = document.createElement('script');
  e.type = 'text/javascript';
  e.id = 'janrainAuthWidget';

  if (document.location.protocol === 'https:') {
    e.src = 'https://rpxnow.com/js/lib/kylepaulsen/engage.js';
  } else {
    e.src = 'http://widget-cdn.rpxnow.com/js/lib/kylepaulsen/engage.js';
  }

  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(e, s);
})();


// ======== Optional client side auth function: ========== //
function janrainWidgetOnload() {
  var closeModal = function(){
    janrain.engage.signin.modal.close();
  };

  janrain.events.onProviderLoginToken.addHandler(function(tokenResponse) {
    $.ajax({
      type: 'POST',
      url: '/login',
      data: "token="+tokenResponse.token,
      dataType: "json",
      success: function(user){
        $("#userLink").removeClass("hide").text(user.name || "Logged In");
        $("#loginLink").addClass("hide");
        closeModal();
      }
    });
  });

  janrain.events.onProviderLoginCancel.addHandler(closeModal);
  janrain.events.onProviderLoginComplete.addHandler(closeModal);
  janrain.events.onProviderLoginError.addHandler(closeModal);
  janrain.events.onProviderLoginSuccess.addHandler(closeModal);
}