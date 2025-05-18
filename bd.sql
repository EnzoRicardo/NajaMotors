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

-- Carro
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
    imagem LONGBLOB,
    FOREIGN KEY (modelo_id) REFERENCES Modelo(id) ON DELETE CASCADE
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

-- Dados de exemplo

-- Usuário
INSERT INTO Usuario (nome, email, cpf, senha, funcao)
VALUES ('admin', 'admin', '000.000.000-00', '$2b$10$H29tuCnNp9ID.bZYwohWKeBa5VBaRzHdbA5fzDnySv7Sb0GXMktNO', 'admin');

-- Marcas
INSERT INTO Marca (nome) VALUES ('Naja');
-- Modelos
INSERT INTO Modelo (nome, marca_id) VALUES ('Naja Striker 57', 1); 
INSERT INTO Modelo (nome, marca_id) VALUES ('Naja Viper', 1); 
INSERT INTO Modelo (nome, marca_id) VALUES ('Naja Titan XTR', 1);   

-- Carros
INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo) 
			VALUES (2025, 95000.00, 1, 280, 4.8, 'V4 2.0L TwinPower', 'Metálico Cinza Cobra', 420, 'Automático de 8 marchas', 50, 'Traseira', 12.5); -- Striker
INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo) 
			VALUES (2025, 105000.00, 2, 350, 2.4, 'V8 8.0 TwinPower', 'Metálico Cinza Cobra', 820, 'Automático de 8 marchas', 80, 'Traseira', 7.5); -- Viper
INSERT INTO Carro (ano, preco, modelo_id, velocidademax, aceleracao, motor, cor, potencia, cambio, torque, tracao, consumo) 
			VALUES (2025, 135000.00, 3, 210, 6.4, 'V6 3.5L TwinPower - Flex', 'Cinza Onyx Vulcano', 420, 'Automático de 10 marchas', 63, '4x4 Inteligente', 8.9); -- Titan

-- Pedido (realizado pelo usuário Ana)
INSERT INTO Pedido (usuario_id, status)
VALUES (1, 'Em andamento');

-- Pedido_Carro (dois carros no mesmo pedido)
INSERT INTO Pedido_Carro (pedido_id, carro_id, quantidade)
VALUES (1, 1, 1), -- Corolla
       (1, 2, 1); -- Civic

-- Consultas carro
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

-- Verificar usuários
SELECT * FROM Usuario;

SELECT * FROM Marca;

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
    WHERE Carro.id = 1;
