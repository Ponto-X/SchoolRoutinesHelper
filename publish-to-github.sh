#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# publish-to-github.sh
# Publica o projeto em https://github.com/Ponto-X/SchoolRoutinesHelper
#
# USO:
#   chmod +x publish-to-github.sh
#   ./publish-to-github.sh ghp_SEU_TOKEN_AQUI
# ─────────────────────────────────────────────────────────────────

set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "❌ Informe o token: ./publish-to-github.sh ghp_SEU_TOKEN"
  echo ""
  echo "Como gerar o token:"
  echo "  1. Acesse https://github.com/settings/tokens/new"
  echo "  2. Escopo necessário: repo (Full control of private repositories)"
  echo "  3. O token precisa ter acesso à organização Ponto-X"
  exit 1
fi

ORG="Ponto-X"
REPO="SchoolRoutinesHelper"
API="https://api.github.com"

echo "🔍 Verificando se o repositório existe..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $TOKEN" \
  "$API/repos/$ORG/$REPO")

if [ "$STATUS" = "404" ]; then
  echo "📦 Repositório não existe — criando em $ORG/$REPO..."
  curl -s -X POST \
    -H "Authorization: token $TOKEN" \
    -H "Content-Type: application/json" \
    "$API/orgs/$ORG/repos" \
    -d "{
      \"name\": \"$REPO\",
      \"description\": \"Sistema de Gestão Escolar — Colégio 21 de Abril\",
      \"private\": false,
      \"auto_init\": false
    }" > /dev/null
  echo "✅ Repositório criado."
elif [ "$STATUS" = "200" ]; then
  echo "✅ Repositório já existe."
else
  echo "❌ Erro ao verificar repositório (HTTP $STATUS). Verifique o token e as permissões."
  exit 1
fi

echo ""
echo "🚀 Fazendo push para https://github.com/$ORG/$REPO..."

# Configura o remote com o token embutido na URL
git remote remove origin 2>/dev/null || true
git remote add origin "https://$TOKEN@github.com/$ORG/$REPO.git"

git push -u origin main --force

echo ""
echo "✅ Publicado com sucesso!"
echo "🔗 https://github.com/$ORG/$REPO"
echo ""
echo "Próximo passo — deploy no Railway:"
echo "  1. Acesse https://railway.app/new"
echo "  2. Escolha 'Deploy from GitHub repo'"
echo "  3. Selecione Ponto-X/SchoolRoutinesHelper"
echo "  4. Railway detecta railway.json automaticamente e faz o deploy"
