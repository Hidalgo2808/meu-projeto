import type { BancoRegistros, Carro, Colaborador } from './types';

const foto = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const fotoW = (n: number) => `https://randomuser.me/api/portraits/women/${n}.jpg`;

export const MOCK_COLABORADORES: Colaborador[] = [
  { id: 'c001', nome: 'João Silva', cpf: '48201173055', matricula: '1001', funcao: 'Motorista', foto: foto(32), status: 'ativo' },
  { id: 'c002', nome: 'Pedro Santos', cpf: '61935487012', matricula: '1002', funcao: 'Auxiliar', foto: foto(22), status: 'ativo' },
  { id: 'c003', nome: 'Carlos Souza', cpf: '73091826405', matricula: '1003', funcao: 'Auxiliar', foto: foto(45), status: 'ativo' },
  { id: 'c004', nome: 'Marcos Lima', cpf: '19573840277', matricula: '1004', funcao: 'Líder de Equipe', foto: foto(53), status: 'ativo' },
  { id: 'c005', nome: 'Rafael Oliveira', cpf: '80421563971', matricula: '1005', funcao: 'Motorista', foto: foto(11), status: 'ativo' },
  { id: 'c006', nome: 'Lucas Ferreira', cpf: '33258719046', matricula: '1006', funcao: 'Auxiliar', foto: foto(15), status: 'ativo' },
  { id: 'c007', nome: 'André Costa', cpf: '57190348268', matricula: '1007', funcao: 'Auxiliar', foto: foto(29), status: 'ativo' },
  { id: 'c008', nome: 'Tiago Almeida', cpf: '90847213560', matricula: '1008', funcao: 'Líder de Equipe', foto: foto(36), status: 'ativo' },
  { id: 'c009', nome: 'Bruno Cardoso', cpf: '24719058341', matricula: '1009', funcao: 'Motorista', foto: foto(41), status: 'ativo' },
  { id: 'c010', nome: 'Diego Martins', cpf: '68503241799', matricula: '1010', funcao: 'Auxiliar', foto: foto(59), status: 'ativo' },
  { id: 'c011', nome: 'Felipe Rocha', cpf: '13086429573', matricula: '1011', funcao: 'Auxiliar', foto: foto(64), status: 'ativo' },
  { id: 'c012', nome: 'Gustavo Dias', cpf: '47925160833', matricula: '1012', funcao: 'Líder de Equipe', foto: foto(68), status: 'ativo' },
  { id: 'c013', nome: 'Henrique Barbosa', cpf: '81264097528', matricula: '1013', funcao: 'Motorista', foto: foto(71), status: 'ativo' },
  { id: 'c014', nome: 'Igor Teixeira', cpf: '35691820417', matricula: '1014', funcao: 'Auxiliar', foto: foto(75), status: 'ativo' },
  { id: 'c015', nome: 'Julio Campos', cpf: '90417356280', matricula: '1015', funcao: 'Auxiliar', foto: foto(81), status: 'ativo' },
  { id: 'c016', nome: 'Leandro Pinto', cpf: '52830741692', matricula: '1016', funcao: 'Líder de Equipe', foto: foto(85), status: 'ativo' },
  { id: 'c017', nome: 'Marcelo Vieira', cpf: '16749283054', matricula: '1017', funcao: 'Motorista', foto: foto(12), status: 'ativo' },
  { id: 'c018', nome: 'Otávio Nunes', cpf: '79361804526', matricula: '1018', funcao: 'Auxiliar', foto: foto(18), status: 'ativo' },
  { id: 'c019', nome: 'Paulo Henrique', cpf: '42170539618', matricula: '1019', funcao: 'Auxiliar', foto: foto(26), status: 'ativo' },
  { id: 'c020', nome: 'Rodrigo Freitas', cpf: '63829407145', matricula: '1020', funcao: 'Líder de Equipe', foto: foto(33), status: 'ativo' },
  { id: 'c021', nome: 'Samuel Ribeiro', cpf: '27581049367', matricula: '1021', funcao: 'Motorista', foto: foto(52), status: 'ativo' },
  { id: 'c022', nome: 'Vinicius Moura', cpf: '89063412758', matricula: '1022', funcao: 'Auxiliar', foto: foto(61), status: 'ativo' },
  { id: 'c023', nome: 'Wesley Batista', cpf: '10497528369', matricula: '1023', funcao: 'Auxiliar', foto: foto(77), status: 'ativo' },
  { id: 'c024', nome: 'Yuri Carvalho', cpf: '56732189044', matricula: '1024', funcao: 'Líder de Equipe', foto: foto(83), status: 'ativo' },
  // Reservas / disponíveis para substituição
  { id: 'c025', nome: 'Alex Sandro', cpf: '31985740266', matricula: '2001', funcao: 'Auxiliar', foto: foto(91), status: 'reserva' },
  { id: 'c026', nome: 'Camila Torres', cpf: '74269013587', matricula: '2002', funcao: 'Auxiliar', foto: fotoW(44), status: 'reserva' },
  { id: 'c027', nome: 'Danilo Peixoto', cpf: '85612379042', matricula: '2003', funcao: 'Motorista', foto: foto(95), status: 'reserva' },
  { id: 'c028', nome: 'Eduardo Sampaio', cpf: '20938475163', matricula: '2004', funcao: 'Auxiliar', foto: foto(97), status: 'reserva' },
  { id: 'c029', nome: 'Fernanda Luz', cpf: '63147802915', matricula: '2005', funcao: 'Auxiliar', foto: fotoW(65), status: 'reserva' },
  { id: 'c030', nome: 'Gabriel Pires', cpf: '97530148620', matricula: '2006', funcao: 'Auxiliar', foto: foto(13), status: 'reserva' },
];

export const MOCK_CARROS: Carro[] = [
  { id: 'car01', prefixo: '4x4-01', placa: 'ABC-1234', modelo: 'Hilux 4x4', posicoes: ['c001', 'c002', 'c003', 'c004'], status: 'operando' },
  { id: 'car02', prefixo: '4x4-02', placa: 'DEF-5678', modelo: 'S10 4x4', posicoes: ['c005', 'c006', 'c007', 'c008'], status: 'operando' },
  { id: 'car03', prefixo: '4x4-03', placa: 'GHI-9012', modelo: 'Ranger 4x4', posicoes: ['c009', 'c010', 'c011', 'c012'], status: 'operando' },
  { id: 'car04', prefixo: '4x4-04', placa: 'JKL-3456', modelo: 'Hilux 4x4', posicoes: ['c013', 'c014', 'c015', 'c016'], status: 'operando' },
  { id: 'car05', prefixo: '4x4-05', placa: 'MNO-7890', modelo: 'Triton 4x4', posicoes: ['c017', 'c018', 'c019', 'c020'], status: 'operando' },
  { id: 'car06', prefixo: '4x4-06', placa: 'PQR-1122', modelo: 'S10 4x4', posicoes: ['c021', 'c022', 'c023', 'c024'], status: 'operando' },
];

/** Gera um histórico de 6 dias anteriores para o gráfico (determinístico) */
export function mockHistorico(): BancoRegistros {
  const dias: Array<[string, Array<[string, string]>]> = [
    ['2026-09-15', [['c003', 'falta'], ['c010', 'falta'], ['c014', 'falta'], ['c019', 'falta'], ['c022', 'falta'], ['c007', 'falta']]],
    ['2026-09-16', [['c005', 'falta'], ['c011', 'falta'], ['c020', 'falta'], ['c023', 'falta']]],
    ['2026-09-17', [['c002', 'falta'], ['c008', 'falta'], ['c009', 'falta'], ['c015', 'falta'], ['c016', 'falta'], ['c021', 'falta'], ['c024', 'falta']]],
    ['2026-09-18', [['c006', 'falta'], ['c012', 'falta'], ['c017', 'falta']]],
    ['2026-09-19', [['c001', 'falta'], ['c004', 'falta'], ['c013', 'falta'], ['c018', 'falta'], ['c022', 'falta']]],
    ['2026-09-20', [['c007', 'falta'], ['c014', 'falta']]],
  ];
  const out: BancoRegistros = {};
  for (const [data, faltas] of dias) {
    const dia: BancoRegistros[string] = {};
    for (const [id] of faltas) {
      dia[id] = { situacao: 'falta', hora: '06:45', responsavel: 'Gestor', motivo: 'Não compareceu' };
    }
    out[data] = dia;
  }
  return out;
}
