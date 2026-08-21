@echo off
title Processar solicitacoes ERP - DevFlow
cd /d "H:\DESENVOLVIMENTOS"
echo =========================================
echo PROCESSAR SOLICITACOES ERP - DEVFLOW
echo =========================================
echo.
echo Somente documentos solicitados pelos botoes serao consultados.
echo Nenhuma varredura completa sera executada.
echo.
python script_compras\sincronizar_compras_sc.py --only-requested
echo.
echo Processamento concluido.
pause
