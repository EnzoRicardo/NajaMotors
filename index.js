const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const secret = 'ola';
const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('./Home'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'PUC@1234',
    database: 'najamotors'
});

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Os campos são obrigatórios.' });
    }

    const q = `SELECT * FROM usuarios WHERE email = ?`
    
    db.query(q, [email], async (err,data) => {
        if (err) return res.status(500).json(err)
        
        if(data.length === 0) return res.status(401).json({message: 'Usuário não encontrado'})
        
        const usuario = data[0];
        const passmatch = await bcrypt.compare(senha, usuario.senha);

        if (!passmatch) {
            return res.status(401).json({message: 'Senha incorreta.'})
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, nome: usuario.nome },
            secret,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ message: "Logado com sucesso", token });
    })
});

// API listar
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar usuários.' });
        res.status(200).json(results);
    });
});

// API Delete
app.delete('/api/usuarios/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir usuário.' });
        res.status(200).json({ message: 'Usuário excluído com sucesso!' });
    });
});

// API Update
app.put('/api/usuarios/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { nome, email, cpf, senha } = req.body;

    db.query('UPDATE usuarios SET nome = ?, email = ?, cpf = ?, senha = ? WHERE id = ?', [nome, email, cpf, senha, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar usuário.' });
        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    });
});


// API Create Usuário
app.post('/api/cadastrarU', async (req, res) => {
    const { nome, email, cpf, senha } = req.body;

    if (!nome || !email || !cpf || !senha) {
        return res.status(400).json({ message: 'Os campos são obrigatórios.' });
    }

    const hashpass = await bcrypt.hash(senha, 10);
    const q = `INSERT INTO usuarios (nome, email, cpf, senha) VALUES (?, ?, ?, ?)`
    
    db.query(q, [nome,email,cpf,hashpass], (err,data) => {
        if (err) return res.json(err)
        return res.json("Usuário registrado.")
    })
});


// API listar carro
app.get('/api/produtos', (req, res) => {
    db.query('SELECT * FROM produtos', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao buscar produtos.' });
        }

        // Convertendo o BLOB de volta para Base64 para envio
        const produtosComImagemBase64 = results.map(produto => ({
            ...produto,
            imagem: produto.imagem ? produto.imagem.toString('base64') : null  // Converte o BLOB de volta para Base64
        }));

        res.json(produtosComImagemBase64);
    });
});

// API Delete Carro
app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM produtos WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir produto.' });
        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    });
});

// API Update Carro
app.put('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco } = req.body;

    db.query(
        'UPDATE produtos SET nome = ?, descricao = ?, preco = ? WHERE id = ?',
        [nome, descricao, preco, id],
        (err, results) => {
            if (err) return res.status(500).json({ message: 'Erro ao atualizar produto.' });
            res.status(200).json({ message: 'Produto atualizado com sucesso!' });
        }
    );
});

// API Create Carro
app.post('/api/cadastrarP', (req, res) => {
    const { nome, descricao, preco, imagem } = req.body;

    if (!nome || !descricao || !preco || !imagem) {
        return res.status(400).json({ message: 'Os campos são obrigatórios.' });
    }

    const imagemBuffer = Buffer.from(imagem, 'base64')

    // Inserir produto no banco de dados
    const query = `INSERT INTO produtos (nome, descricao, preco, imagem) VALUES (?, ?, ?, ?)`;
    db.query(query, [nome, descricao, preco, imagemBuffer], (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).json({message: 'Erro ao cadastrar produto.'});
        }
        res.status(201).json({message: 'Produto cadastrado com sucesso!'});
    });
});


function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido.'});
    }

    jwt.verify(token, secret, (err, user) => {
        if(err) return res.status(403).json({message: 'Token inválido'});

        req.user = user;
        next();
    })
}

app.get('/api/protegido', verifyToken, (req, res) => {
    res.json({ message: 'Você acessou uma rota protegido!', user: req.user });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
