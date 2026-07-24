// Limitador de tentativas de login (anti-força-bruta), em memória.
// Adequado para uma única instância. Os contadores zeram ao reiniciar o app.
// É usado com DUAS chaves por tentativa: por e-mail e por IP — assim ele barra
// tanto o ataque a uma conta específica quanto um IP tentando vários e-mails.

const MAX_TENTATIVAS = 5; // falhas permitidas dentro da janela
const JANELA_MS = 15 * 60 * 1000; // 15 minutos para acumular falhas
const BLOQUEIO_MS = 15 * 60 * 1000; // quanto o bloqueio dura após estourar o limite

type Registro = { count: number; expira: number };
const tentativas = new Map<string, Registro>();

function agora() {
  return Date.now();
}

/** Remove ocasionalmente entradas expiradas para o mapa não crescer indefinidamente. */
function limpar() {
  if (tentativas.size < 1000) return;
  const t = agora();
  for (const [k, v] of tentativas) if (t > v.expira) tentativas.delete(k);
}

/** true se a chave excedeu o limite de falhas e ainda está no período de bloqueio. */
export function estaBloqueado(chave: string): boolean {
  const r = tentativas.get(chave);
  if (!r) return false;
  if (agora() > r.expira) {
    tentativas.delete(chave);
    return false;
  }
  return r.count >= MAX_TENTATIVAS;
}

/** Registra uma falha de login. Ao atingir o limite, cada nova tentativa
 *  RENOVA o bloqueio (bloqueio deslizante) — martelar não adianta. */
export function registrarFalha(chave: string): void {
  limpar();
  const r = tentativas.get(chave);
  if (!r || agora() > r.expira) {
    tentativas.set(chave, { count: 1, expira: agora() + JANELA_MS });
    return;
  }
  r.count++;
  if (r.count >= MAX_TENTATIVAS) {
    r.expira = agora() + BLOQUEIO_MS; // mantém bloqueado enquanto continuar tentando
  }
}

/** Limpa o histórico de falhas (após um login bem-sucedido). */
export function limparTentativas(chave: string): void {
  tentativas.delete(chave);
}
