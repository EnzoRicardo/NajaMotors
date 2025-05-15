const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { message } = require('statuses');
const app = express();


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('./Home'));

app.use(session({
    secret: 'carro',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));

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

    const q = `SELECT * FROM usuario WHERE email = ?`
    
    db.query(q, [email], async (err,data) => {
        if (err) return res.status(500).json(err)
        
        if(data.length === 0) return res.status(401).json({message: 'Usuário não encontrado'})
        
        const usuario = data[0];
        const passmatch = await bcrypt.compare(senha, usuario.senha);

        if (!passmatch) {
            return res.status(401).json({message: 'Senha incorreta.'})
        }

        req.session.user = {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email
        }

        return res.status(200).json({ message: "Logado com sucesso"});
    })
});

// API listar
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuario', (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar usuários.' });
        res.status(200).json(results);
    });
});

// API Delete
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuario WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir usuário.' });
        res.status(200).json({ message: 'Usuário excluído com sucesso!' });
    });
});

// API Update
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, cpf } = req.body;

    db.query('UPDATE usuario SET nome = ?, email = ?, cpf = ? WHERE id = ?', [nome, email, cpf, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar usuário.' });
        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    });
});


// API Create Usuário
app.post('/api/cadastrarU', async (req, res) => {
    const { nome, email, cpf, senha } = req.body;

    if (!nome || !email || !cpf  || !senha) {
        return res.status(400).json({ message: 'Os campos são obrigatórios.' });
    }

    const hashpass = await bcrypt.hash(senha, 10);
    const q = `INSERT INTO usuario (nome, email, cpf, senha) VALUES (?, ?, ?, ?)`
    
    db.query(q, [nome,email,cpf,hashpass], (err,data) => {
        if (err){
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Email ou CPF ja cadastrados.'});
            }
            return res.json(err)
        } 
            
        return res.json("Usuário registrado.")
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            return res.status(500).json({ message: 'Erro ao fazer logout. '});
        }
        res.json({ message: 'Logout realizado. '});
    })
})

function authMiddleware(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Não autorizado' });
    }
}


app.get('/api/usuario', authMiddleware, (req, res) => {
    res.json({usuario: req.session.user})
})


// API listar Carro
app.get('/api/carros', (req, res) => {
    const sql = `
        SELECT 
            Carro.id AS id,
            Carro.ano,
            CONCAT('R$ ', FORMAT(Carro.preco, 2, 'pt_BR')) AS preco,
            Modelo.nome AS modelo,
            Marca.nome AS marca
        FROM Carro
        JOIN Modelo ON Carro.modelo_id = Modelo.id
        JOIN Marca ON Modelo.marca_id = Marca.id
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar carros.' });
        res.status(200).json(results);
    });
});


app.post('/api/cadastrarC', (req, res) => {
    const { ano, preco, modelo } = req.body;

    // Buscar modelo_id
    const buscaModelo = 'SELECT id FROM Modelo WHERE nome = ? LIMIT 1';

    db.query(buscaModelo, [modelo], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Modelo não encontrado.' });
        }

        const modelo_id = results[0].id;

        const insert = 'INSERT INTO Carro (ano, preco, modelo_id) VALUES (?, ?, ?)';
        db.query(insert, [ano, preco, modelo_id], (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao cadastrar carro.' });
            res.status(200).json({ message: 'Carro cadastrado com sucesso!' });
        });
    });
});


app.put('/api/carro/:id', (req, res) => {
    const { ano, preco, modelo } = req.body;
    const id = req.params.id;

    const buscaModelo = 'SELECT id FROM Modelo WHERE nome = ? LIMIT 1';
    
    db.query(buscaModelo, [modelo], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Modelo não encontrado.' });
        }

        const modelo_id = results[0].id;

        const updateQuery = 'UPDATE Carro SET ano = ?, preco = ?, modelo_id = ? WHERE id = ?';
        db.query(updateQuery, [ano, preco, modelo_id, id], (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao atualizar carro.' });
            res.status(200).json({ message: 'Carro atualizado com sucesso!' });
        });
    });
});


// API Delete Carro
app.delete('/api/carro/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Carro WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir carro.' });
        res.status(200).json({ message: 'Carro excluído com sucesso!' });
    });
});




const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
