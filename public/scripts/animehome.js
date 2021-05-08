function userbutton(){
  if($("#signout").css("display")=="none"){
      $("#signout").css("display","block");
      $("#userinfo").css("display","block");
      $("#headeruser>div").css('z-index',100);
      $("#headeruser>div").css('background-color',"whitesmoke");
      return;
  }
  if($("#signout").css("display")=="block")
  {
    $("#signout").css("display","none");
      $("#userinfo").css("display","none");;
    $("#headeruser>div").css('background-color',"white");
    $("#headeruser>div").css('z-index',0);
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