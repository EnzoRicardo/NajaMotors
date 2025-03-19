document.addEventListener("DOMContentLoaded", function () {
    const textElement = document.getElementById("about-title");
    const text = "Sobre a Naja Motors";
    let index = 0;

    function typeEffect() {
        if (index < text.length) {
            textElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(typeEffect, 100);
        }
    }

    typeEffect();
});

const images = document.querySelectorAll(".image-box img");
let currentIndex = 0;

function changeImage() {
    images.forEach(img => img.style.display = "none"); 
    images[currentIndex].style.display = "block";
    currentIndex = (currentIndex + 1) % images.length;
}

setInterval(changeImage, 3000); 
changeImage();


const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
        backToTop.style.display = "block";
    } else {
        backToTop.style.display = "none";
    }
});

backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
});