window.onload = async () => {
    const res = await fetch('/api/usuario2');
    const user = await res.json();

    document.getElementById('nome').value = user.nome;
    document.getElementById('email').value = user.email;

    const foto = document.getElementById('foto-usuario');
    foto.src = user.imagemBase64 
        ? `data:image/jpeg;base64,${user.imagemBase64}`
        : 'IMG/user.png';
};

async function salvarAlteracoes() {
    const nome = document.getElementById('nome').value;
    const senhaAtual = document.getElementById('senha-atual').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const imagem = document.getElementById('upload-photo').files[0];

    const senhaForteRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (novaSenha && novaSenha !== confirmarSenha) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'A nova senha e a confirmação não coincidem.'
        });
        return;
    }

    if (novaSenha && !senhaForteRegex.test(novaSenha)) {
        Swal.fire({
            icon: 'warning',
            title: 'Senha Fraca',
            html: 'A nova senha deve conter pelo menos:<br>• 8 caracteres<br>• 1 letra maiúscula<br>• 1 número<br>• 1 caractere especial'
        });
        return;
    }

    const formData = new FormData();
    if (novaSenha) {
        if (!senhaAtual) {
            Swal.fire({
                icon: 'warning',
                title: 'Senha Atual Necessária',
                text: 'Digite a senha atual para mudar a senha.'
            });
            return;
        }
        formData.append('senhaAtual', senhaAtual);
        formData.append('novaSenha', novaSenha);
    }

    if (imagem) formData.append('imagem', imagem);
    if (nome) formData.append('nome', nome);

    const res = await fetch('/api/usuario/atualizar', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();

    Swal.fire({
        icon: res.ok ? 'success' : 'error',
        title: res.ok ? 'Sucesso' : 'Erro',
        text: data.message
    }).then(() => {
        if (res.ok) {
            window.location.reload();
        }
    });
}


document.getElementById('mostrar-senha').addEventListener('change', function () {
    const tipo = this.checked ? 'text' : 'password';
    document.getElementById('senha-atual').type = tipo;
    document.getElementById('nova-senha').type = tipo;
    document.getElementById('confirmar-senha').type = tipo;
});

document.getElementById('upload-photo').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const preview = document.getElementById('foto-usuario');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});
