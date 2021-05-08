function posting(){
    if($("#postingcom").val()!=""){
       var loc=window.location.href.split("/");
       var pid=loc[loc.length-1];
        $.ajax({
          url : "/binger/com/"+pid,
          method : "GET",
          dataType : "json",
          success : function(data)
          {
            $.ajax({
                url : window.location.href,
                type : "POST",
                data : {
                    commentid : parseInt(data.comlen)+1,
                    commentbody : $("#postingcom").val()
                },
                success : function(dat){
                    console.log("teset");
                    
                },
                error : function(err)
                {
                  console.log(err);
                }
            })
            var inhtml="<div class='post'><input type='hidden' value="+(parseInt(data.comlen)+1)+"><div><img src='"+data.profile_pic+"' alt='' height='50px' width='50px'></div><div class='left-side'><div class='timeuser'><p>"+data.username+"</p><p>"+(new Date()).toLocaleTimeString('en-IN')+"</p></div><div>"+$("#postingcom").val()+"</div><div class='rbutton'><button onclick='expanding(this)'>Reply</button></div></div></div><div class='reply areply'><div><img src='"+data.profile_pic+"' alt='' height='50px' width='50px'></div><div><div>"+data.username+"</div><input type='text' class='postingrep'><button onclick='replying(this)'>Reply</button></div></div><div style='none'></div>";
            $(".comment").prepend(inhtml);
          },error : function(err){
              console.log(err);
          }
        });
        
    }
  }
function replying(element){
if(element.previousElementSibling.value!="")
{
  var loc=window.location.href.split("/");
  var pid=loc[loc.length-1];
  var ele=element.parentNode.parentNode.previousElementSibling.firstElementChild.value;
  console.log(ele);
  $.ajax({
    url : "/binger/com/"+pid+"/"+ele,
    type : "GET",
    dataType : "json",
    success : function(data)
    {
      $.ajax({
        url : window.location.href,
        type : "POST",
        data : {
          replyid : data.replen+1,
          commentid : ele,
          replybody : element.parentNode.childNodes[1].value
        },
        error : function(er){
          alert("Error in posting reply.Sorry for the inconvenience");
        }
      })
          var inhtml="<div class='alreply'><div><img src='"+data.profile_pic+"' alt='' height='50px' width='50px'></div><div><div class='timeuser'><p>"+data.username+"</p><p>"+(new Date()).toLocaleTimeString('en-IN')+"</p></div><div>"+element.previousElementSibling.value+"</div></div></div>";
          console.log(element.parentNode.parentNode);
          $(element.parentNode.parentNode.nextElementSibling).prepend(inhtml);
    },
    error : function(err){
      console.log(err);
    }
  });
 /* $.ajax({
    url : window.location.href,
    type : "POST",
    data : {
      commentid : parseInt(element.parentNode.className.slice(6)),
      profile_pic : ud.profile_image, 
      username : ud.username,
      replybody : $("#postingrep").val()
    },error : function(err)
        {
          console.log(err);
        }
  })
  var inhtml="<div>"+$("#postingrep").val()+"</div>";
  $(element.nextElementSibling).prepend(inhtml);*/
}
}
function expanding(element){
    var ele=element.parentNode.parentNode.parentNode.nextElementSibling;
    var next = element.parentNode.parentNode.parentNode.nextElementSibling.nextElementSibling;
    console.log(ele);
    if(ele.classList.length==2)
    {
        ele.classList.remove("areply");
        next.style.display="block";
    }
    else{
        ele.classList.add("areply");
        next.style.display="none";
    }
}