🧠⚔️ EduBoss: Arena do Conhecimento

EduBoss é um jogo educativo desenvolvido com Phaser 3, onde aprendizado e ação se encontram.
O jogador enfrenta um boss em uma arena, respondendo perguntas enquanto desvia de ataques e gerencia recursos em tempo real.

🎯 Aprenda, reaja e vença — conhecimento é sua arma.

🚀 Demo (em breve)

🔗 Deploy via Vercel: [link aqui]

🎮 Sobre o Projeto

EduBoss foi projetado para transformar o processo de aprendizado em uma experiência dinâmica e envolvente.

Ao invés de apenas responder perguntas, o jogador precisa:

🧠 Pensar rápido
🕹️ Se movimentar estrategicamente
🎯 Escolher a resposta correta
⚔️ Atacar o boss

Tudo isso enquanto sobrevive a um sistema de combate ativo.

🧩 Mecânicas Principais
🧠 Sistema de perguntas e respostas integrado à gameplay
👾 Boss com múltiplos tipos de ataque (Projectile, Danger Zone, Smash)
🎯 Sistema de coleta de respostas no mapa
🔫 Canhão para disparar respostas no boss
❤️ Sistema de vida do jogador
📊 Sistema de pontuação com penalidade por erro
⚡ Feedback visual avançado (VFX, hit effects, camera shake)
🎚️ Sistema de dificuldade (Fácil, Normal, Difícil)
🧠 Sistema Educacional
As perguntas vêm de uma API (JSON)
O jogador só avança ao acertar corretamente
Erros não travam o progresso, mas aumentam a pressão da gameplay
Integração futura com sistema educacional (Ouro Moderno)
🧱 Arquitetura

O projeto segue uma estrutura modular e escalável:


⚙️ Tecnologias Utilizadas
🎮 Phaser 3
🟦 TypeScript
🌐 Vercel (Deploy)
🔗 API REST (JSON)
🎨 Sistema de UI customizado com tema visual
🎚️ Sistema de Dificuldade

O jogo possui três níveis:

Dificuldade	Descrição
🟢 Fácil	Ritmo tranquilo, ideal para aprendizado
🟡 Normal	Desafio equilibrado
🔴 Difícil	Alta pressão e resposta rápida

A dificuldade altera:

Frequência de ataques
Tempo de reação
Dispersão das respostas
Penalidade por erro
🎨 UI e Experiência
Interface totalmente customizada
Sistema de tema visual centralizado
Painéis arredondados e consistentes
Menu inicial com instruções e seleção de dificuldade
Feedback visual avançado (VFX e animações)
🧪 Como Rodar Localmente
# Clone o repositório
git clone https://github.com/Maiconn-G/EduBoss

# Acesse a pasta
cd eduboss

# Instale as dependências
npm install

# Rode o projeto
npm run dev

Abra no navegador:

http://localhost:5173
☁️ Deploy (Vercel)

O projeto está preparado para deploy com Vercel.

npm run build

Depois:

Suba o repositório no GitHub
Conecte na Vercel
Deploy automático 🚀
🔌 Integração com API

Exemplo de estrutura esperada:

{
  "aula_id": 123,
  "questoes": [
    {
      "id": 1,
      "texto": "Qual o resultado de 5x5?",
      "opcoes": ["20", "25", "30"],
      "correta": "25"
    }
  ]
}
📈 Roadmap
 Integração completa com sistema da Ouro Moderno
 Mais tipos de ataques do boss
 Sistema de progresso por aluno
 Ranking / leaderboard
 Novos temas visuais
 Sistema de áudio completo
 Mobile support
🤝 Contribuição

Contribuições são bem-vindas!

Fork o projeto
Crie uma branch (feature/minha-feature)
Commit suas mudanças
Push
Abra um Pull Request
📄 Licença

Este projeto está sob a licença MIT.

👨‍💻 Autor

Desenvolvido por Maiconn-G 💪
Com foco em inovação no ensino digital.

💡 Visão

EduBoss não é apenas um jogo — é uma nova forma de aprender.
Transformando conteúdo educacional em experiência interativa.
