@echo off
title Monitor SC e OC sob demanda - DevFlow
cd /d "H:\DESENVOLVIMENTOS"
echo =========================================
echo MONITOR SC E OC SOB DEMANDA - DEVFLOW
echo =========================================
echo.
echo Atualizacao completa automatica: desativada
echo O conector reage somente aos botoes do sistema
echo.
python script_compras\sincronizar_compras_sc.py --watch --request-poll 60
echo.
echo O monitor foi encerrado.
pause
