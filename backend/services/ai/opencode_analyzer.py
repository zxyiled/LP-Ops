from __future__ import annotations

import json
import logging
import subprocess
import threading
from typing import Any

logger = logging.getLogger(__name__)

TIMEOUT = 30

OPencode_RUN_ARGS = [
    "opencode",
    "run",
    "--format", "json",
    "--dangerously-skip-permissions",
]


def analyze_with_opencode(context: dict[str, Any]) -> dict[str, Any] | None:
    try:
        subprocess.run(["which", "opencode"], capture_output=True, check=True)
    except subprocess.CalledProcessError:
        logger.info("opencode CLI not found, using fallback analysis")
        return None

    prompt = _build_prompt(context)

    proc = subprocess.Popen(
        OPencode_RUN_ARGS,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    try:
        proc.stdin.write(prompt)
        proc.stdin.close()
    except OSError:
        logger.warning("opencode stdin write failed")
        _kill_process(proc)
        return _fallback_from_context(context)

    text = _wait_for_text_event(proc, timeout=TIMEOUT)

    _kill_process(proc)
    _close_pipe(proc.stdout)
    stderr = _try_read_stderr(proc)
    _close_pipe(proc.stderr)

    if text is None:
        logger.warning("opencode did not produce a text event within %ds", TIMEOUT)
        if stderr:
            logger.warning("opencode stderr: %s", stderr[:500])
        return _fallback_from_context(context)

    if not _looks_like_json_insights(text):
        logger.warning("opencode returned non-JSON text, falling back")
        logger.debug("opencode raw text: %s", text[:500])
        return _fallback_from_context(context)

    return _parse_insights(text, context)


def _wait_for_text_event(proc: subprocess.Popen, timeout: int) -> str | None:
    result: list[str] = []

    def reader():
        try:
            for line in proc.stdout:
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                    if event.get("type") == "text":
                        text = event.get("part", {}).get("text", "")
                        if text:
                            result.append(text)
                            return
                except (json.JSONDecodeError, KeyError):
                    continue
        except Exception:
            pass

    thread = threading.Thread(target=reader, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if result:
        return result[0]
    return None


def _try_read_stderr(proc: subprocess.Popen, timeout: int = 2) -> str:
    result: list[str] = []

    def reader():
        try:
            data = proc.stderr.read()
            if data:
                result.append(data)
        except Exception:
            pass

    thread = threading.Thread(target=reader, daemon=True)
    thread.start()
    thread.join(timeout=timeout)
    return result[0] if result else ""


def _kill_process(proc: subprocess.Popen) -> None:
    try:
        proc.kill()
        proc.wait(timeout=5)
    except Exception:
        pass


def _close_pipe(pipe) -> None:
    if pipe and not pipe.closed:
        try:
            pipe.close()
        except Exception:
            pass


def _looks_like_json_insights(text: str) -> bool:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return False
    if not isinstance(data, dict):
        return False
    insights = data.get("insights")
    return isinstance(insights, list) and len(insights) > 0


def _build_prompt(context: dict[str, Any]) -> str:
    return f"""
Eres un analista experto en Investigación de Operaciones integrado como motor de análisis interno de una aplicación web.

Contexto completo del modelo:
```json
{json.dumps(context, indent=2, ensure_ascii=False)}
```

Analiza la solución y genera insights estructurados.

Debes responder ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques ```, sin explicaciones adicionales.
No uses herramientas, no ejecutes código, solo analiza el contexto proporcionado.

Formato requerido (respetar exactamente):
{{"insights": [{{"title": "título corto", "description": "explicación detallada", "severity": "info|warning|success"}}]}}

Reglas:
- Entre 2 y 5 insights
- "severity" debe ser exactamente "info", "warning" o "success"
- "title" debe ser corto y descriptivo (max 60 chars)
- "description" debe ser útil y accionable (2-3 oraciones)
- Si la solución es óptima, incluye un insight de tipo "success" destacando el valor objetivo
- Si hay restricciones binding (críticas), incluye un insight "warning" señalándolas
- Si hay holgura en recursos, menciona cuáles están siendo infrautilizados
- Para problemas de asignación, destaca la asignación más costosa/menos eficiente
- Para problemas de transporte, menciona rutas con mayor flujo y eficiencia general
"""


def _parse_insights(text: str, context: dict[str, Any]) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse opencode JSON output")
        return _fallback_from_context(context)

    insights = data.get("insights", [])
    if not isinstance(insights, list) or len(insights) == 0:
        return _fallback_from_context(context)

    return {"insights": insights}


def _fallback_from_context(context: dict[str, Any]) -> dict[str, Any]:
    solution = context.get("solution", {})
    mapped = {
        "is_optimal": solution.get("status") == "optimal",
        "objective_value": solution.get("objective_value"),
        "constraints": solution.get("constraint_analysis", []),
    }
    from backend.services.ai.analyzer import _fallback_analysis
    return _fallback_analysis(mapped)
