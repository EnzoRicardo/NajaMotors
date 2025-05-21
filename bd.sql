-- Apagar o banco de dados existente
DROP DATABASE IF EXISTS najamotors;
CREATE DATABASE najamotors;
USE najamotors;

-- Usuário
CREATE TABLE Usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    cpf VARCHAR(255) UNIQUE,
    funcao VARCHAR(20) DEFAULT 'user',
    imagem LONGBLOB,
    senha VARCHAR(255)
);

-- Marca
CREATE TABLE Marca (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) UNIQUE
);

-- Modelo
CREATE TABLE Modelo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    marca_id INT,
    FOREIGN KEY (marca_id) REFERENCES Marca(id) ON DELETE CASCADE
);

-- Carro (sem mais campo texto_id)
CREATE TABLE Carro (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ano INT,
    preco DECIMAL(10,2),
    modelo_id INT,
    velocidademax INT,
    aceleracao FLOAT,
    motor VARCHAR(255),
    cor VARCHAR(255),
    potencia INT,
    cambio VARCHAR(255),
    torque INT,
    tracao VARCHAR(255),
    consumo FLOAT,
    imagem LONGBLOB DEFAULT NULL,
    FOREIGN KEY (modelo_id) REFERENCES Modelo(id) ON DELETE CASCADE
);

-- Texto (agora ligado diretamente ao Carro, com relação 1:1)
CREATE TABLE Texto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    carro_id INT UNIQUE,
    descricao1 TEXT,
    descricao2 TEXT,
    descricao3 TEXT,
    titulo1 TEXT,
    titulo2 TEXT,
    FOREIGN KEY (carro_id) REFERENCES Carro(id) ON DELETE CASCADE
);

-- Pedido
CREATE TABLE Pedido (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
);

-- Pedido_Carro
CREATE TABLE Pedido_Carro (
    pedido_id INT,
    carro_id INT,
    quantidade INT DEFAULT 1,
    PRIMARY KEY (pedido_id, carro_id),
    FOREIGN KEY (pedido_id) REFERENCES Pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (carro_id) REFERENCES Carro(id) ON DELETE CASCADE
);

-- Inserir usuário
INSERT INTO Usuario (nome, email, cpf, senha, funcao)
VALUES ('admin', 'admin', '000.000.000-00', '$2b$10$H29tuCnNp9ID.bZYwohWKeBa5VBaRzHdbA5fzDnySv7Sb0GXMktNO', 'admin');

-- Inserir marcas e modelos
INSERT INTO Marca (nome) VALUES ('Naja');

INSERT INTO Modelo (nome, marca_id) VALUES ('Naja Striker 57', 1); 
INSERT INTO Modelo (nome, marca_id) VALUES ('Naja Viper', 1); 
INSERT INTO Modelo (nome, marca_id) VALUES ('Naja Titan XTR', 1);   

-- Inserir carros
INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo) 
VALUES (2025, 95000.00, 1, 280, 4.8, 'V4 2.0L TwinPower', 'Metálico Cinza Cobra', 420, 'Automático de 8 marchas', 50, 'Traseira', 12.5); -- id = 1

INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo) 
VALUES (2025, 105000.00, 2, 350, 2.4, 'V8 8.0 TwinPower', 'Metálico Cinza Cobra', 820, 'Automático de 8 marchas', 80, 'Traseira', 7.5); -- id = 2

INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo) 
VALUES (2025, 135000.00, 3, 210, 6.4, 'V6 3.5L TwinPower - Flex', 'Cinza Onyx Vulcano', 420, 'Automático de 10 marchas', 63, '4x4 Inteligente', 8.9); -- id = 3

-- Inserir textos ligados exclusivamente a cada carro
INSERT INTO Texto (carro_id, descricao1, descricao2, descricao3, titulo1, titulo2) VALUES 
(1, 'O {modelo} não é apenas um carro. Ele é uma afirmação. Com um design agressivo,
                engenharia de precisão e alma esportiva, ele entrega o equilíbrio perfeito entre performance e presença.','Cada curva do seu chassi é moldada com propósito. Cada detalhe do seu interior foi desenhado
                para elevar o padrão. Seja na estrada, na cidade ou no seu imaginário, o Striker 57 nasceu para marcar território.','Adquira agora mesmo o superesportivo que redefine o seu conceito de liberdade.','Uma máquina criada para dominar','Pronto para ter o seu Naja Striker 57?'),

(2, 'O {modelo} é mais do que um esportivo — é um ícone urbano de presença inconfundível. Seu design robusto e aerodinâmico nasce da fusão entre velocidade bruta e sofisticação selvagem.', 'Desenvolvido para dominar tanto avenidas quanto curvas fechadas, o Viper entrega torque instantâneo, estabilidade extrema e um ronco que impõe respeito. Onde quer que passe, ele não apenas acelera — ele impõe sua história.', 'Garanta hoje o muscle car que transforma potência em presença, e cada trajeto em uma declaração.', 'Potência forjada nas ruas', 'Pronto para ter o seu Naja Viper?'),

(3, 'O {modelo} nasceu para ir além do asfalto. Com estrutura reforçada, tração imponente e motor de alta performance, ele foi projetado para vencer qualquer desafio — da cidade à estrada de terra.', 
																				  'Robusto, inteligente e imponente, o Titan combina o poder de uma picape com a sofisticação de um Naja. Seja na lida do campo, em trilhas ou cruzando paisagens urbanas, ele entrega autoridade em cada detalhe.', 
                                                                                  'Garanta agora a picape que transforma força em atitude — e cada caminho em território conquistado.', 
                                                                                  'Força que desafia qualquer terreno', 
                                                                                  'Pronto para ter o seu Naja Titan?');

SELECT 
    Carro.id AS carro_id,
    Modelo.nome AS modelo,
    Marca.nome AS marca,
    Carro.ano,
    Carro.preco,
    Texto.descricao1,
    Texto.titulo1
FROM Carro
JOIN Modelo ON Carro.modelo_id = Modelo.id
JOIN Marca ON Modelo.marca_id = Marca.id
LEFT JOIN Texto ON Texto.carro_id = Carro.id;

SELECT 
    Carro.id AS id,
    Marca.nome AS marca,
    Modelo.nome AS modelo,
    Carro.ano,
    preco,
    velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo,
    Texto.descricao1, Texto.descricao2, Texto.descricao3, Texto.titulo1, Texto.titulo2
FROM Carro
JOIN Modelo ON Carro.modelo_id = Modelo.id
JOIN Marca ON Modelo.marca_id = Marca.id
LEFT JOIN Texto ON Texto.carro_id = Carro.id
WHERE Carro.id = 2;

SELECT * FROM Texto;


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



