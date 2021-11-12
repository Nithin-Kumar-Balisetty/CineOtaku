const switchers = [...document.querySelectorAll('.switcher')]
switchers.forEach(item => {
	item.addEventListener('click', function() {
		switchers.forEach(item => item.parentElement.classList.remove('is-active'))
		this.parentElement.classList.add('is-active')
	})
})
document.getElementById('signup').addEventListener("click",function(){
  document.getElementsByTagName('TITLE')[0].innerHTML="Sign Up";
});
if(document.getElementsByTagName('section')[0].id=="samp1")
{
	document.getElementById("signup").click();
}

function validateForm() {
  var x = document.forms["signinform"]["pass"].value;
  var y=document.forms["signinform"]["confirmpass"].value;
  if (x !=y) {
    alert("Check the confirm password field once");
    return false;
  }
}

if(document.getElementById("alexist")!=null){
		document.getElementById("signup").click();
}
if(document.getElementById("alexist1")!=null){
  document.getElementById("signup").click();
}
function checking(id)
{
	var x = document.getElementById(id);
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}
