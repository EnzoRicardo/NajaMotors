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
const sharp = require('sharp');


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

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
    password: '',
    database: 'najamotors'
});
// 
// 

app.post('/api/cadastrarU', upload.single('imagem'), async (req, res) => {
    const { nome, email, cpf, senha } = req.body;
    const imagem = req.file?.buffer;

    if (!nome || !email || !cpf || !senha) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const hashpass = await bcrypt.hash(senha, 10);
        const q = `INSERT INTO usuario (nome, email, cpf, senha, imagem) VALUES (?, ?, ?, ?, ?)`;

        db.query(q, [nome, email, cpf, hashpass, imagem], (err, data) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email ou CPF já cadastrados.' });
                }
                return res.status(500).json(err);
            }

            return res.status(201).json({ message: 'Usuário registrado.' });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro no servidor', error });
    }
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

    const {
        ano, preco, modelo_id, velocidademax, aceleracao, motor,
        cor, potencia, cambio, torque, tracao, consumo
    } = req.body;

    let imagemBuffer = null;

    if (req.file) {
        try {
            imagemBuffer = await sharp(req.file.buffer)
                .resize(800, 600) // Redimensiona proporcionalmente
                .jpeg({ quality: 70 }) // Comprime a imagem
                .toBuffer();
        } catch (err) {
            console.error('Erro ao processar a imagem:', err);
            return res.status(500).json({ message: 'Erro ao processar a imagem.' });
        }
    } else {
        console.log("Nenhuma imagem foi enviada.");
    }

    const insert = `
        INSERT INTO Carro 
        (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo, imagem) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(insert, [
        ano, preco, modelo_id, velocidademax, aceleracao, motor,
        cor, potencia, cambio, torque, tracao, consumo, imagemBuffer
    ], (err) => {
        if (err) return res.status(500).json({ message: 'Erro ao cadastrar carro.' });
        res.status(200).json({ message: 'Carro cadastrado com sucesso!' });
    });
});



// API Atualizar Carro

app.put('/api/carro/:id', upload.single('imagem'), async (req, res) => {
    const {
        ano, preco, modelo, velocidademax, aceleracao, motor,
        cor, potencia, cambio, torque, tracao, consumo
    } = req.body;
    const id = req.params.id;
    const modelo_id = modelo;

    let imagemBuffer = null;

    if (req.file) {
        try {
            imagemBuffer = await sharp(req.file.buffer)
                .resize(800, 600)
                .jpeg({ quality: 70 })
                .toBuffer();
        } catch (err) {
            console.error('Erro ao processar a imagem:', err);
            return res.status(500).json({ message: 'Erro ao processar a imagem.' });
        }
    }

    let updateQuery, params;

    if (imagemBuffer) {
        updateQuery = `
            UPDATE Carro 
            SET ano = ?, preco = ?, modelo_id = ?, velocidademax = ?, aceleracao = ?, 
                motor = ?, cor = ?, potencia = ?, cambio = ?, torque = ?, tracao = ?, 
                consumo = ?, imagem = ?
            WHERE id = ?`;
        params = [
            ano, preco, modelo_id, velocidademax, aceleracao, motor,
            cor, potencia, cambio, torque, tracao, consumo, imagemBuffer, id
        ];
    } else {
        updateQuery = `
            UPDATE Carro 
            SET ano = ?, preco = ?, modelo_id = ?, velocidademax = ?, aceleracao = ?, 
                motor = ?, cor = ?, potencia = ?, cambio = ?, torque = ?, tracao = ?, 
                consumo = ?
            WHERE id = ?`;
        params = [
            ano, preco, modelo_id, velocidademax, aceleracao, motor,
            cor, potencia, cambio, torque, tracao, consumo, id
        ];
    }

    db.query(updateQuery, params, (err) => {
        if (err) {
            console.error('Erro ao atualizar carro:', err);
            return res.status(500).json({ message: 'Erro ao atualizar carro.' });
        }
        res.status(200).json({ message: 'Carro atualizado com sucesso!' });
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
        Texto.id AS texto_id,
        Marca.nome AS marca,
        Modelo.nome AS modelo,
        Carro.ano,
        Carro.preco,
        Carro.velocidademax, 
        Carro.aceleracao, 
        Carro.motor, 
        Carro.cor, 
        Carro.potencia, 
        Carro.cambio, 
        Carro.torque, 
        Carro.tracao, 
        Carro.consumo, 
        Carro.imagem,
        Texto.descricao1,
        Texto.descricao2,
        Texto.descricao3,
        Texto.titulo1,
        Texto.titulo2
    FROM Carro
    JOIN Modelo ON Carro.modelo_id = Modelo.id
    JOIN Marca ON Modelo.marca_id = Marca.id
    LEFT JOIN Texto ON Texto.carro_id = Carro.id;

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
        Carro.preco,
        Carro.velocidademax, 
        Carro.aceleracao, 
        Carro.motor, 
        Carro.cor, 
        Carro.potencia, 
        Carro.cambio, 
        Carro.torque, 
        Carro.tracao, 
        Carro.consumo,
        Texto.descricao1,
        Texto.descricao2,
        Texto.descricao3,
        Texto.titulo1,
        Texto.titulo2
    FROM Carro
    JOIN Modelo ON Carro.modelo_id = Modelo.id
    JOIN Marca ON Modelo.marca_id = Marca.id
    LEFT JOIN Texto ON Texto.carro_id = Carro.id
    WHERE Carro.id = ?;

    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar o carro.' });
        if (results.length === 0) return res.status(404).json({ message: 'Carro não encontrado.' });
        res.status(200).json(results[0]);
    });
});


// Rota para servir imagem por ID
app.get('/api/imagem/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT imagem FROM carro WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Imagem não encontrada');
    }

    const imagem = results[0].imagem;
    const tipo = results[0].FotoMimeType || 'image/jpeg'; // mime padrão caso não tenha

    res.setHeader('Content-Type', tipo);
    res.send(imagem);
  });
});


// API Listar todos os carros (nome, preço e imagem base64)

app.get('/api/carros', (req, res) => {
    const sql = `
        SELECT 
            Carro.id,
            Modelo.nome AS nome,
            Carro.preco,
            Carro.imagem
        FROM Carro
        JOIN Modelo ON Carro.modelo_id = Modelo.id;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar carros:', err);
            return res.status(500).json({ message: 'Erro ao buscar carros.' });
        }

        const carros = results.map(carro => ({
            id: carro.id,
            nome: carro.nome,
            preco: carro.preco,
            imagem: carro.imagem 
                ? `data:image/jpeg;base64,${carro.imagem.toString('base64')}` 
                : null
        }));

        res.status(200).json(carros);
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

    if (!nome) {
        return res.status(400).json({ message: 'Os campos são obrigatórios.' });
    }

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

// API Deletar Modelo
app.delete('/api/modelo/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Modelo WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir Modelo.' });
        res.status(200).json({ message: 'Modelo excluído com sucesso!' });
    });
});


// API listar Texto
app.get('/api/texto', (req, res) => {
    const sql = `
    SELECT * FROM Texto;
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar textos.' });
        res.status(200).json(results);
    });
});


// API Cadastrar Texto

// Criar novo Texto
app.post('/api/cadastrarT', (req, res) => {
    const { carro_id, descricao1, descricao2, descricao3, titulo1, titulo2 } = req.body;

    // Validação simples
    if (!carro_id || !descricao1 || !descricao2 || !descricao3 || !titulo1 || !titulo2) {
        return res.status(400).json({ message: 'Campos obrigatórios.' });
    }

    const sql = 'INSERT INTO Texto (carro_id, descricao1, descricao2, descricao3, titulo1, titulo2)  VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sql, [carro_id, descricao1, descricao2, descricao3, titulo1, titulo2], (err, result) => {
        if (err) {
            console.error('Erro ao inserir textos:', err);
            return res.status(500).json({ message: 'Erro ao criar texto.' });
        }

        res.status(201).json({ 
            message: 'Texto criado com sucesso!',
            id: result.insertId 
        });
    });
});


// API Update de Texto
app.put('/api/texto/:id', (req, res) => {
    const { id } = req.params;
    const { carro_id, titulo1, titulo2, descricao1, descricao2, descricao3 } = req.body;

    db.query('UPDATE Texto SET carro_id = ?, titulo1 = ?, titulo2 = ?, descricao1 = ?, descricao2 = ?, descricao3 = ? WHERE id = ?', [carro_id, titulo1, titulo2, descricao1, descricao2, descricao3, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao atualizar texto.' });
        res.status(200).json({ message: 'Texto atualizado com sucesso!' });
    });
});

// API Deletar Texto
app.delete('/api/texto/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Texto WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao excluir Texto.' });
        res.status(200).json({ message: 'Texto excluído com sucesso!' });
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

// API Middleware para barrar usuário não autenticado e não admin

app.get('/crud', authMiddleware, adminMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'home', 'crud.html'));
});

// Iniciar Servidor

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


app.post('/api/pedidos', (req, res) => {
    const { usuario_id, carro_id } = req.body;

    db.query(`INSERT INTO Pedido (usuario_id) VALUES (?)`, [usuario_id], (err, result) => {
        if (err) {
            console.error('Erro ao inserir pedido:', err);
            return res.status(500).json({ error: 'Erro ao criar pedido' });
        }

        const pedidoId = result.insertId;

        db.query(`INSERT INTO Pedido_Carro (pedido_id, carro_id) VALUES (?, ?)`, [pedidoId, carro_id], (err2) => {
            if (err2) {
                console.error('Erro ao inserir pedido_carro:', err2);
                return res.status(500).json({ error: 'Erro ao associar carro ao pedido' });
            }

            res.status(201).json({ message: 'Pedido criado com sucesso', pedidoId });
        });
    });
});



app.delete('/api/pedidos/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM Pedido WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar pedido:', err);
            return res.status(500).json({ error: 'Erro ao cancelar pedido' });
        }

        res.json({ message: 'Pedido cancelado com sucesso' });
    });
});


app.get('/api/pedidos/usuario/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT Pedido.id AS pedido_id, Modelo.nome AS modelo, Carro.preco AS preco, Carro.imagem
    FROM Pedido
    JOIN Pedido_Carro ON Pedido.id = Pedido_Carro.pedido_id
    JOIN Carro ON Pedido_Carro.carro_id = Carro.id
    JOIN Modelo ON Carro.modelo_id = Modelo.id
    JOIN Marca ON Modelo.marca_id = Marca.id
    WHERE Pedido.usuario_id = ?;
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar pedidos:', err);
      return res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }

    const pedidosFormatados = results.map(pedido => ({
      pedido_id: pedido.pedido_id,
      nome: `${pedido.modelo}`,
      preco: pedido.preco,
      imagem: pedido.imagem
        ? `data:image/jpeg;base64,${pedido.imagem.toString('base64')}`
        : null
    }));

    res.json(pedidosFormatados);
  });
});


// API listar Carro
app.get('/api/pedido', (req, res) => {
    const sql = `
    SELECT 
        Pedido.id AS pedido_id,
        Usuario.nome AS usuario,
        Marca.nome AS marca,
        Modelo.nome AS modelo
    FROM Pedido
    JOIN Usuario ON Pedido.usuario_id = Usuario.id
    JOIN Pedido_Carro ON Pedido.id = Pedido_Carro.pedido_id
    JOIN Carro ON Pedido_Carro.carro_id = Carro.id
    JOIN Modelo ON Carro.modelo_id = Modelo.id
    JOIN Marca ON Modelo.marca_id = Marca.id;


    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erro ao buscar pedidos.' });
        res.status(200).json(results);
    });
});

// Servir o arquivo index.html na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Home', 'index.html'));
});


// Middleware para proteger arquivos específicos
const arquivosProtegidos = ['/crud.html', '/crudcarro.html', '/crudmarca.html', '/crudmodelo.html', '/crudpedido.html', '/crudtexto.html'];
const arquivosLogin = ['/pedidos.html', '/usuario.html'];

app.use((req, res, next) => {
    // Protege rotas que precisam de login e admin
    if (arquivosProtegidos.includes(req.path)) {
        if (!req.session.user) {
            return res.redirect('/login/login.html');
        }
        if (req.session.user.funcao !== 'admin') {
            return res.redirect('/index.html'); // Ou outra página como /403.html
        }
    }

    // Protege rotas que só precisam de login
    if (arquivosLogin.includes(req.path)) {
        if (!req.session.user) {
            return res.redirect('/login/login.html');
        }
    }

    next();
});

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'Home')));

app.get('/api/usuario/imagem/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT imagem FROM usuario WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) return res.sendStatus(404);
        res.setHeader('Content-Type', 'image/jpeg'); // ou 'image/png'
        res.send(results[0].imagem);
    });
});

app.get('/api/usuario2', (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Não autenticado' });

    const q = 'SELECT nome, email, imagem FROM usuario WHERE id = ?';
    db.query(q, [req.session.user.id], (err, data) => {
        if (err) return res.status(500).json(err);

        const usuario = data[0];
        const imagemBase64 = usuario.imagem ? usuario.imagem.toString('base64') : null;

        res.json({
            nome: usuario.nome,
            email: usuario.email,
            imagemBase64
        });
    });
});

app.post('/api/usuario/atualizar', upload.single('imagem'), async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ message: 'Não autorizado.' });

    try {
        const { nome, senhaAtual, novaSenha } = req.body;
        let imagemBuffer = null;

        if (req.file) {
            // Reduz a imagem para 300x300 e comprime em JPEG com 70% de qualidade
            imagemBuffer = await sharp(req.file.buffer)
                .resize(300, 300)
                .jpeg({ quality: 70 })
                .toBuffer();
        }

        let query = 'UPDATE usuario SET ';
        const params = [];

        if (nome) {
            query += 'nome = ?, ';
            params.push(nome);
        }

        if (imagemBuffer) {
            query += 'imagem = ?, ';
            params.push(imagemBuffer);
        }

        if (novaSenha && senhaAtual) {
            const userResult = await new Promise((resolve, reject) => {
                db.query('SELECT senha FROM usuario WHERE id = ?', [userId], (err, data) => {
                    if (err) return reject(err);
                    resolve(data[0]);
                });
            });

            const senhaOk = await bcrypt.compare(senhaAtual, userResult.senha);
            if (!senhaOk) return res.status(400).json({ message: 'Senha atual incorreta.' });

            const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
            query += 'senha = ?, ';
            params.push(senhaCriptografada);
        }

        // Remove vírgula final e adiciona condição WHERE
        query = query.slice(0, -2) + ' WHERE id = ?';
        params.push(userId);

        db.query(query, params, (err) => {
            if (err) return res.status(500).json({ message: 'Erro ao atualizar.' });
            res.json({ message: 'Dados atualizados com sucesso!' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao processar a imagem.' });
    }
});

