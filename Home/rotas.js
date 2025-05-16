// public/js/rotas.js

function crud() {
    fetch('/crud')
        .then(res => {
            if (!res.ok) {
                return res.json().then(data => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Acesso negado',
                        text: data.message || 'Você precisa estar logado para acessar esta página.'
                    });
                    throw new Error(data.message);
                });
            }
            window.location.href = '/crud';
        })
        .catch(err => console.error(err));
}
