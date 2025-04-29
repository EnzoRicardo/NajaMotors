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

document.querySelectorAll('.image-box').forEach(box => {
    const imgs = box.querySelectorAll('img');
    let index = 0;

    // Esconde todas as imagens menos a primeira
    imgs.forEach((img, i) => img.style.display = i === 0 ? 'block' : 'none');

    // Função para alternar dentro dessa image-box
    setInterval(() => {
        imgs.forEach(img => img.style.display = 'none');
        imgs[index].style.display = 'block';
        index = (index + 1) % imgs.length;
    }, 3000);
});


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