@echo off
title Monitor de SC - DevFlow
cd /d "H:\DESENVOLVIMENTOS"
echo =========================================
echo MONITOR DE APROVACAO DE SC - DEVFLOW
echo =========================================
echo.
echo Atualizacao completa: a cada 15 minutos
echo Botoes do sistema: verificados a cada 15 segundos
echo.
python script_compras\sincronizar_compras_sc.py --watch --full-interval 900 --request-poll 15
echo.
echo O monitor foi encerrado.
pause
