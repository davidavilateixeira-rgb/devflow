@echo off
title Atualizar SCs agora - DevFlow
cd /d "H:\DESENVOLVIMENTOS"
echo Consultando todas as SCs cadastradas no DevFlow...
python script_compras\sincronizar_compras_sc.py
echo.
pause
