$(".headeruser").css("position","relative");
$(".headeruser").css("margin-left","500px");
function userbutton(){
  if(document.getElementById('signout').style.display=="none"){
      document.getElementById('signout').style.display="block";
      document.getElementById('userinfo').style.display="block";
      $(".headeruser").css('background-color',"whitesmoke");
      $(".headeruser").css('z-index',20);
      return;
  }
  if(document.getElementById('signout').style.display=="block")
  {
    document.getElementById('signout').style.display="none";
    document.getElementById('userinfo').style.display="none";
    $(".headeruser").css('background-color',"white");
    $(".headeruser").css('z-index',0);
  }
}
function signout()
{
  location.replace("/signout");
}
function myaccount()
{
  location.replace("/myaccount");
}