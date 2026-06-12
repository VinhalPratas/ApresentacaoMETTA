CREATE TABLE pacientes (
  id INTEGER PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  cpf VARCHAR(14),
  data_nascimento DATE,
  telefone VARCHAR(30),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE convenios (
  id INTEGER PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  codigo_ans VARCHAR(30),
  prazo_recurso_dias INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE exames (
  id INTEGER PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  modalidade VARCHAR(80) NOT NULL,
  codigo_tuss VARCHAR(30),
  valor_referencia DECIMAL(12,2)
);

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY,
  nome VARCHAR(140) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  perfil VARCHAR(40) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE guias (
  id INTEGER PRIMARY KEY,
  numero VARCHAR(40) UNIQUE NOT NULL,
  paciente_id INTEGER NOT NULL,
  convenio_id INTEGER NOT NULL,
  exame_id INTEGER NOT NULL,
  data_exame DATE NOT NULL,
  autorizacao VARCHAR(80),
  autorizacao_validade DATE,
  assinatura_presente BOOLEAN DEFAULT FALSE,
  pedido_legivel BOOLEAN DEFAULT TRUE,
  laudo_vinculado BOOLEAN DEFAULT FALSE,
  imagens_vinculadas BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (convenio_id) REFERENCES convenios(id),
  FOREIGN KEY (exame_id) REFERENCES exames(id)
);

CREATE TABLE faturamento (
  id INTEGER PRIMARY KEY,
  guia_id INTEGER NOT NULL,
  data_faturamento DATE NOT NULL,
  valor_original DECIMAL(12,2) NOT NULL,
  valor_recebido DECIMAL(12,2) DEFAULT 0,
  responsavel_id INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL,
  risco_glosa_percentual DECIMAL(5,2),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guia_id) REFERENCES guias(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE recebimentos (
  id INTEGER PRIMARY KEY,
  faturamento_id INTEGER NOT NULL,
  data_recebimento DATE NOT NULL,
  valor_recebido DECIMAL(12,2) NOT NULL,
  forma_recebimento VARCHAR(80),
  FOREIGN KEY (faturamento_id) REFERENCES faturamento(id)
);

CREATE TABLE glosas (
  id INTEGER PRIMARY KEY,
  guia_id INTEGER NOT NULL,
  convenio_id INTEGER NOT NULL,
  motivo VARCHAR(80) NOT NULL,
  valor_glosado DECIMAL(12,2) NOT NULL,
  data_glosa DATE NOT NULL,
  responsavel_id INTEGER NOT NULL,
  prazo_recurso DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'Aberta',
  FOREIGN KEY (guia_id) REFERENCES guias(id),
  FOREIGN KEY (convenio_id) REFERENCES convenios(id),
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

CREATE TABLE recursos (
  id INTEGER PRIMARY KEY,
  glosa_id INTEGER NOT NULL,
  carta_recurso TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  anexos_necessarios TEXT,
  data_envio DATE,
  valor_recuperado DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Pendente',
  FOREIGN KEY (glosa_id) REFERENCES glosas(id)
);

CREATE TABLE auditoria (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER,
  entidade VARCHAR(80) NOT NULL,
  entidade_id INTEGER NOT NULL,
  acao VARCHAR(80) NOT NULL,
  dados_anteriores TEXT,
  dados_novos TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
