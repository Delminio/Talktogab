# English Voice Chat com OpenRouter

Projeto de prática de inglês por áudio com:

- Web Speech API para capturar sua voz
- `speechSynthesis` para ler a resposta
- OpenRouter como IA
- níveis: fácil, normal, intermediário, avançado e professor
- velocidades: lenta, normal e rápida
- modos: conversa livre, opiniões, pronúncia, debate leve e entrevista
- correção da frase
- explicação curta
- dica de pronúncia
- treino de pronúncia por comparação
- histórico local no navegador

## 1) Instalação

No terminal, dentro da pasta do projeto:

```bash
npm install
```

## 2) Configurar a chave

Renomeie `.env.example` para `.env` e coloque sua chave:

```env
OPENROUTER_API_KEY=sua_chave_aqui
PORT=3000
OPENROUTER_MODEL=openrouter/auto
```

Você também pode trocar o modelo por algum gratuito, por exemplo:
- `openrouter/auto`
- algum modelo `:free` disponível na sua conta do OpenRouter

## 3) Rodar

```bash
npm start
```

Depois abra:

```txt
http://localhost:3000
```

## 4) Como usar

- Escolha o nível
- Escolha o modo
- Ajuste a velocidade da voz
- Clique em **Falar**
- Permita o microfone no navegador
- Fale em inglês

## 5) Recomendações

- Use **Google Chrome** no Windows
- O reconhecimento de voz depende do suporte do navegador
- Não exponha sua chave do OpenRouter no frontend; ela fica no `.env`

## 6) Ideias para versão 2

- login
- pontuação diária
- lista de erros frequentes
- exportar histórico
- temas prontos de conversa
- botão “explicar tudo em português”
- modo shadowing
- gravação de áudio para revisar depois
