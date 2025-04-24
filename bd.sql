DROP DATABASE IF EXISTS najamotors;
CREATE DATABASE najamotors;
USE najamotors;

CREATE TABLE Usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    cpf VARCHAR(255),
    senha VARCHAR(255)
);

CREATE TABLE Marca (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) UNIQUE
);

CREATE TABLE Modelo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    marca_id INT,
    FOREIGN KEY (marca_id) REFERENCES Marca(id)
);

CREATE TABLE Carro (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ano INT,
    preco DECIMAL(10,2),
    modelo_id INT,
    FOREIGN KEY (modelo_id) REFERENCES Modelo(id)
);

CREATE TABLE Pedido (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id)
);

CREATE TABLE Pedido_Carro (
    pedido_id INT,
    carro_id INT,
    quantidade INT DEFAULT 1,
    PRIMARY KEY (pedido_id, carro_id),
    FOREIGN KEY (pedido_id) REFERENCES Pedido(id),
    FOREIGN KEY (carro_id) REFERENCES Carro(id)
);

SELECT * FROM usuario;

