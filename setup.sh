#!/usr/bin/env bash
# setup.sh — Instala skill e prepara ambiente para o projeto Bancolombia Account Plan
# Uso: bash setup.sh
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Setup: Bancolombia Account Plan ===${NC}"

# 1. Instalar skill no Claude Code
SKILL_DIR="$HOME/.claude/skills/salesforce-screen-flow-lwc"
if [ -d "$SKILL_DIR" ]; then
  echo -e "${YELLOW}Skill já existe em $SKILL_DIR — sobrescrevendo...${NC}"
fi
mkdir -p "$SKILL_DIR"
cp "$(dirname "$0")/.claude-skill/skill.md" "$SKILL_DIR/skill.md"
echo -e "${GREEN}✓ Skill 'salesforce-screen-flow-lwc' instalada em $SKILL_DIR${NC}"

# 2. Inicializar git (se ainda não existir)
if [ ! -d "$(dirname "$0")/.git" ]; then
  git -C "$(dirname "$0")" init
  git -C "$(dirname "$0")" add .
  git -C "$(dirname "$0")" commit -m "chore: initial project setup — bc_createAccountPlan LWC (Tela 1)"
  echo -e "${GREEN}✓ Repositório git inicializado${NC}"
else
  echo -e "${YELLOW}Git já inicializado — pulando${NC}"
fi

# 3. Verificar Salesforce CLI
if ! command -v sf &> /dev/null; then
  echo -e "${YELLOW}⚠ Salesforce CLI não encontrado. Instale com:${NC}"
  echo "  npm install -g @salesforce/cli"
else
  echo -e "${GREEN}✓ Salesforce CLI: $(sf --version | head -1)${NC}"
fi

echo ""
echo -e "${GREEN}=== Pronto! ===${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Autenticar no org:  sf org login web --alias bancolombia-sandbox"
echo "  2. Deploy:             sf project deploy start --source-dir force-app --target-org bancolombia-sandbox"
echo "  3. Abrir Claude Code:  claude"
echo ""
echo "Skill disponível no Claude Code: /salesforce-screen-flow-lwc"
