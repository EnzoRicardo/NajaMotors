// usuario.js

window.onload = async () => {
    const res = await fetch('/api/usuario2');
    const user = await res.json();

    document.getElementById('nome').value = user.nome;
    document.getElementById('email').value = user.email;

    const foto = document.getElementById('foto-usuario');
    foto.src = user.imagemBase64 
        ? `data:image/jpeg;base64,${user.imagemBase64}`
        : 'IMG/user.png'; // Caminho da imagem padrão

};

async function salvarAlteracoes() {
    const nome = document.getElementById('nome').value;
    const senhaAtual = document.getElementById('senha-atual').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const imagem = document.getElementById('upload-photo').files[0];

    if (novaSenha && novaSenha !== confirmarSenha) {
        alert('A nova senha e a confirmação não coincidem.');
        return;
    }

    const formData = new FormData();
    if (novaSenha) {
        if (!senhaAtual) {
            alert('Digite a senha atual para mudar a senha.');
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
    alert(data.message);

    if (res.ok) {
        window.location.reload(); // Atualiza a página
    }
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
            preview.src = e.target.result; // Mostra a imagem escolhida localmente
        };
        reader.readAsDataURL(file); // Lê o arquivo como base64 (imagem temporária)
    }
});

