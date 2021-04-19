function trigger(thi)
{
  $(".fourtypes p").removeClass("removecl");
  $(thi).addClass("removecl");
  if(thi.innerHTML=="Movies")
  {
      console.log("Movies")
      $(".movieratings").hide();
      $(".seriesratings").hide();
      $(".animeratings").hide();
      $(".mangaratings").hide();
        $(".movieratings").show();
  }
  if(thi.innerHTML=="Series")
  {
      console.log("Series");
      $(".movieratings").hide();
      $(".seriesratings").hide();
      $(".animeratings").hide();
      $(".mangaratings").hide();  
        $(".seriesratings").show();
  }
  if(thi.innerHTML=="Anime")
  {
    console.log("Anime");

    $(".movieratings").hide();
      $(".seriesratings").hide();
      $(".animeratings").hide();
      $(".mangaratings").hide();
    $(".animeratings").show();
  }
  if(thi.innerHTML=="Manga")
  {
    console.log("Manga");

    $(".movieratings").hide();
      $(".seriesratings").hide();
      $(".animeratings").hide();
      $(".mangaratings").hide();
    $(".mangaratings").show();
  }
}
trigger($(".fourtypes p").eq(0));