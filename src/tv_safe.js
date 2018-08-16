var img = document.createElement("img");
img.src = "/Assets/Image/Artwork/Backgrounds/ComCast_Safe_Area.png";
img.style.position = "absolute";
img.style.top = 0;
img.style.left = 0;
img.style.zIndex = 100;
img.style.display = 'none';
document.getElementById("main-modal").appendChild(img);
document.addEventListener('keyup', function (event) {
  if (event.keyCode == 221 && event.shiftKey) {
    if (img.style.display == 'none') img.style.display = 'inline';
    else img.style.display = 'none';
  }
})