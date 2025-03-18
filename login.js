function toggleForm() {
    const loginContainer = document.querySelector('.login-container');
    const signupContainer = document.querySelector('.signup-container');
    if (loginContainer.style.display === "none") {
        loginContainer.style.display = "block";
        signupContainer.style.display = "none";
    } else {
        loginContainer.style.display = "none";
        signupContainer.style.display = "block";
    }
}


function signup() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("new-email").value;
    const password = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("As senhas não coincidem.");
        return;
    }

    
    alert('Conta criada com sucesso!');
}

function login() {
    alert('Login realizado com sucesso!');
}