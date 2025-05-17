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
INSERT INTO Modelo (nome, marca_id) VALUES ('Velociraptor X7', 1); -- Toyota
INSERT INTO Modelo (nome, marca_id) VALUES ('Subnova', 1);   -- Honda

-- Carros
INSERT INTO Carro (ano, preco, modelo_id) VALUES (2022, 95000.00, 1); -- Corolla
INSERT INTO Carro (ano, preco, modelo_id) VALUES (2023, 105000.00, 2); -- Civic

-- Pedido (realizado pelo usuário Ana)
INSERT INTO Pedido (usuario_id, status)
VALUES (1, 'Em andamento');

-- Pedido_Carro (dois carros no mesmo pedido)
INSERT INTO Pedido_Carro (pedido_id, carro_id, quantidade)
VALUES (1, 1, 1), -- Corolla
       (1, 2, 1); -- Civic

-- Consultas carro
SELECT 
    Carro.id AS carro_id,
    Marca.nome AS marca,
    Modelo.nome AS modelo,
    Carro.ano,
    CONCAT('R$ ', FORMAT(Carro.preco, 2, 'pt_BR')) AS preco
FROM Carro
JOIN Modelo ON Carro.modelo_id = Modelo.id
JOIN Marca ON Modelo.marca_id = Marca.id;

-- Inserção de novo carro
INSERT INTO Carro (ano, preco, modelo_id) VALUES (2024, 90.0, 1);

-- Verificar usuários
SELECT * FROM Usuario;

SELECT * FROM Marca;


