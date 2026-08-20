"""Impede o deploy quando as referencias de versao do DevFlow divergem."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REPO_DIR = Path(__file__).resolve().parent.parent
INDEX_PATH = REPO_DIR / "public" / "index.html"
VERSION_PATH = REPO_DIR / "public" / "version.json"


def falhar(mensagem: str) -> None:
    print(f"ERRO DE VERSAO: {mensagem}", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    try:
        versao_publicada = str(
            json.loads(VERSION_PATH.read_text(encoding="utf-8"))["version"]
        ).strip()
    except (OSError, KeyError, TypeError, ValueError) as erro:
        falhar(f"nao foi possivel ler {VERSION_PATH}: {erro}")

    if not re.fullmatch(r"\d+\.\d+\.\d+", versao_publicada):
        falhar(f"formato invalido em version.json: {versao_publicada!r}")

    try:
        index_html = INDEX_PATH.read_text(encoding="utf-8")
    except OSError as erro:
        falhar(f"nao foi possivel ler {INDEX_PATH}: {erro}")

    versoes_javascript = re.findall(
        r"""const\s+VERSAO_ATUAL\s*=\s*["'](\d+\.\d+\.\d+)["']""",
        index_html,
    )
    if len(versoes_javascript) != 1:
        falhar(
            "VERSAO_ATUAL deve aparecer exatamente uma vez em public/index.html"
        )

    versoes_badges = re.findall(
        r'<span\s+class="[^"]*badge[^"]*b-cinza[^"]*">v(\d+\.\d+\.\d+)</span>',
        index_html,
    )
    if len(versoes_badges) < 2:
        falhar("os badges de versao esperados nao foram encontrados")

    referencias = {
        "version.json": {versao_publicada},
        "VERSAO_ATUAL": set(versoes_javascript),
        "badges": set(versoes_badges),
    }
    divergentes = {
        origem: sorted(versoes)
        for origem, versoes in referencias.items()
        if versoes != {versao_publicada}
    }
    if divergentes:
        falhar(
            f"referencias divergentes de {versao_publicada}: "
            + json.dumps(divergentes, ensure_ascii=False)
        )

    print(
        f"Versao {versao_publicada} consistente em version.json, "
        "VERSAO_ATUAL e badges."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
