var SHAREURL = HOST;

$("textarea").on("click",function(){
  $(this).focus();
  $(this).select();
})

$("[name=text]").on("click",function(){
  if(!$(this).attr("tested")){
    $(this).attr("tested",true);
    $(this).val("");
  }
})

$("#generate").on("submit",function(){
  const $form = $(this);
  updateFields()
  const apiCall = HOST+"/api/v1/generate?text="+encodeURIComponent($("[name=text]").val())+"&url="+encodeURIComponent($("[name=url]").val());
  $form.find("[name=submit]").attr("disabled",true).text("Generating...");
  $(".sample")[0].src = apiCall;
  $(".sample")[0].onload = function(){
    $form.find("[name=submit]").removeAttr("disabled").text("Generate");
    $(".notshared").hide();
    $(".shared").show();
  }
  const shareURL = "/custom?img="+encodeURIComponent(apiCall+'&width=600&height=315&background=%23F1F1F1');
  const fullShareURL = HOST+shareURL;
  const pxl = document.createElement("img");
  pxl.src = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(fullShareURL);
  SHAREURL = fullShareURL;
  
  return false;
})

function updateFields(){
  const apiCall = HOST+"/api/v1/generate?text="+encodeURIComponent($("[name=text]").val())+"&url="+encodeURIComponent($("[name=url]").val());
  $("#sample-direct").val(apiCall)
  $("#sample-image").val("<img src='"+apiCall+"'/>");
  $("#sample-og").val("<meta property='og:image' content='"+apiCall+'&width=1200&height=630'+"'/>");
}

updateFields()

$("#shareFB").on("click",function(){
  fbshareCurrentPage();
});

function fbshareCurrentPage(){
  window.open(
    "https://www.facebook.com/sharer/sharer.php?u="+escape(SHAREURL), 
    '', 
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600'
  );
  return false; 
}