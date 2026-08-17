@echo off
echo =========================================
echo ATUALIZADOR DE ESTOQUE - DEVFLOW
echo =========================================
echo.
echo Iniciando sincronizacao com ERP e Firebase...
echo.
cd /d "H:\DESENVOLVIMENTOS\script_estoque"
python sincronizar_estoque.py
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
