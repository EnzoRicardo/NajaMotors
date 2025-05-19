const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { message } = require('statuses');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
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




// API Cadastro de usuário
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


// API Update de usuário
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, funcao, cpf } = req.body;

    db.query('UPDATE usuario SET nome = ?, email = ?, cpf = ?, funcao = ? WHERE id = ?', [nome, email, cpf, funcao, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar usuário.' });
        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    });
});

// API listar usuarios
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuario', (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar usuários.' });
        res.status(200).json(results);
    });
});

// API Deletar usuários
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuario WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir usuário.' });
        res.status(200).json({ message: 'Usuário excluído com sucesso!' });
    });
});


// API Login
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
            funcao: usuario.funcao
        }

        return res.status(200).json({ message: "Logado com sucesso"});
    })
});

// API Logout

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            return res.status(500).json({ message: 'Erro ao fazer logout. '});
        }
        res.json({ message: 'Logout realizado. '});
    })
})

// API Autorização de usuário autenticado

app.get('/api/usuario', authMiddleware, (req, res) => {
    res.json({usuario: req.session.user})
})


// API Cadastrar Carro

app.post('/api/cadastrarC', upload.single('imagem'), async (req, res) => {
    console.log('Dados recebidos no cadastro de carro:');
    console.log('Body:', req.body);
    console.log('File:', req.file);


    const { ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo } = req.body;

    const imagemBuffer = req.file ? req.file.buffer : null;

     if (!req.file) {
        console.log("Nenhuma imagem foi enviada.");
    }

    const insert = 'INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(insert, [ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo, imagemBuffer], (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao cadastrar carro.' });
        res.status(200).json({ message: 'Carro cadastrado com sucesso!' });
    });
});


// API Atualizar Carro

app.put('/api/carro/:id', upload.single('imagem'), async (req, res) => {
    const { ano, preco, modelo, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo } = req.body;
    const id = req.params.id;
    const imagemBuffer = req.file ? req.file.buffer : null;

    const buscaModelo = 'SELECT id FROM Modelo WHERE nome = ? LIMIT 1';
    
    db.query(buscaModelo, [modelo], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Modelo não encontrado.' });
        }

        const modelo_id = results[0].id;

        let updateQuery;
        let params;

        if (imagemBuffer) {
            updateQuery = `
                UPDATE Carro 
                SET ano = ?, preco = ?, modelo_id = ?, velocidademax = ?, aceleracao = ?, 
                    motor = ?, cor = ?, potencia = ?, cambio = ?, torque = ?, tracao = ?, 
                    consumo = ?, imagem = ?
                WHERE id = ?`;
            params = [ano, preco, modelo_id ,velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo, imagemBuffer, id];
        } else {
            updateQuery = `
                UPDATE Carro 
                SET ano = ?, preco = ?, modelo_id = ?, velocidademax = ?, aceleracao = ?, 
                    motor = ?, cor = ?, potencia = ?, cambio = ?, torque = ?, tracao = ?, 
                    consumo = ?
                WHERE id = ?`;
            params = [ano, preco, modelo_id ,velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo, id];
        }

        db.query(updateQuery, params, (err) => {
            if (err) {
                console.error('Erro ao atualizar carro:', err);
                return res.status(500).json({ message: 'Erro ao atualizar carro.' });
            }
            res.status(200).json({ message: 'Carro atualizado com sucesso!' });
        });
    });
});


// API Deletar Carro
app.delete('/api/carro/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Carro WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir carro.' });
        res.status(200).json({ message: 'Carro excluído com sucesso!' });
    });
});


// API listar Carro
app.get('/api/carro', (req, res) => {
    const sql = `
    SELECT 
        Carro.id AS id,
        Marca.nome AS marca,
        Modelo.nome AS modelo,
        Carro.ano,
        preco,
        velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo
    FROM Carro
    JOIN Modelo ON Carro.modelo_id = Modelo.id
    JOIN Marca ON Modelo.marca_id = Marca.id;
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar carros.' });
        res.status(200).json(results);
    });
});

// API Listar Carro especifico

app.get('/api/carros/:id', (req, res) => {
    const id = req.params.id;

    const sql = `
    SELECT 
        Carro.id AS id,
        Marca.nome AS marca,
        Modelo.nome AS modelo,
        Carro.ano,
        preco,
        velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo
    FROM Carro
    JOIN Modelo ON Carro.modelo_id = Modelo.id
    JOIN Marca ON Modelo.marca_id = Marca.id
    WHERE Carro.id = ?;
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar o carro.' });
        if (results.length === 0) return res.status(404).json({ message: 'Carro não encontrado.' });
        res.status(200).json(results[0]);
    });
});


// API listar marcas

app.get('/api/marca', (req,res) => {
    const sql = `SELECT * FROM Marca`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500),json({ message: 'Erro ao buscar marcas. '});
        res.status(200).json(results);
    })
})

// API Atualizar Marca

app.put('/api/marca/:id', (req, res) => {
    const { nome } = req.body;
    const id = req.params.id;

    const updateQuery = 'UPDATE Marca SET nome = ? WHERE id = ?';
    db.query(updateQuery, [nome, id], (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar marca.' });
        res.status(200).json({ message: 'Marca atualizada com sucesso!' });
    });
});


// API Cadastrar Marca

app.post('/api/cadastrarM', (req, res) => {
    const { nome } = req.body;

    const insert = 'INSERT INTO Marca (nome) VALUES (?)';
    db.query(insert, [nome], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Marca já cadastrada.' });
            }
            return res.status(500).json({ message: 'Erro ao cadastrar marca.' });
        }
        res.status(200).json({ message: 'Marca cadastrada com sucesso!' });
    });
});


// API Deletar Marca
app.delete('/api/marca/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Marca WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir Marca.' });
        res.status(200).json({ message: 'Marca excluído com sucesso!' });
    });
});


// Função Autorização

function adminMiddleware(req, res, next) {
    if (req.session.user && req.session.user.funcao === 'admin') {
        next();
    } else {
        res.status(403).json({message: 'Acesso restrito: apenas administradores tem acesso.'})
    }
}

// API Cadastrar Modelo

// Criar novo modelo
app.post('/api/cadastrarMo', (req, res) => {
    const { nome, marca_id } = req.body;

    // Validação simples
    if (!nome || !marca_id) {
        return res.status(400).json({ message: 'Nome e marca_id são obrigatórios.' });
    }

    const sql = 'INSERT INTO Modelo (nome, marca_id) VALUES (?, ?)';

    db.query(sql, [nome, marca_id], (err, result) => {
        if (err) {
            console.error('Erro ao inserir modelo:', err);
            return res.status(500).json({ message: 'Erro ao criar modelo.' });
        }

        res.status(201).json({ 
            message: 'Modelo criado com sucesso!',
            id: result.insertId 
        });
    });
});


// API LISTAR modelo 2
app.get('/api/modelos', (req, res) => {
    const query = `
        SELECT m.id, m.nome AS modelo, ma.nome AS marca 
        FROM Modelo m
        JOIN Marca ma ON m.marca_id = ma.id
        ORDER BY ma.nome, m.nome;
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar modelos.' });
        res.status(200).json(results);
    });
});




// API Listar Modelos
app.get('/api/modelo', (req,res) => {
    const sql = `SELECT Modelo.id as id, Modelo.nome AS modelo, Marca.nome AS marca FROM Modelo JOIN Marca ON Modelo.marca_id = Marca.id;`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500),json({ message: 'Erro ao buscar modelo. '});
        res.status(200).json(results);
    })
})

// Atualizar Modelo

app.put('/api/modelo/:id', (req, res) => {
    const { nome } = req.body;
    const id = req.params.id;

    const updateQuery = 'UPDATE Modelo SET nome = ? WHERE id = ?';
    db.query(updateQuery, [nome, id], (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar modelo.' });
        res.status(200).json({ message: 'Modelo atualizada com sucesso!' });
    });
});

// API Deletar Modelo -- PRECISA ARRUMAR
app.delete('/api/modelo/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Modelo WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir Modelo.' });
        res.status(200).json({ message: 'Modelo excluído com sucesso!' });
    });
});

function authMiddleware(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Não autorizado' });
    }
}

const path = require('path');

app.get('/crud', authMiddleware, adminMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'home', 'crud.html'));
});

// Iniciar Servidor

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
