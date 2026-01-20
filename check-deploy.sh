#!/bin/bash
# Verificar status do deploy

export SSHPASS='superfeliz99'
SSH="feliciano@192.168.1.119"

echo "✅ VERIFICANDO STATUS DO DEPLOY"
echo ""
echo "Comando para verificar:"
echo ""
echo "sshpass -e ssh $SSH 'cd /home/feliciano/acrobaticz && docker-compose ps'"
echo ""
echo "Ou:"
echo ""
echo "sshpass -e ssh $SSH 'cd /home/feliciano/acrobaticz && docker-compose logs -f'"
