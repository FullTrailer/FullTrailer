#!/usr/bin/env python3
"""Parse operadores_raw.tsv -> Operadores.json siguiendo el esquema acordado."""
import csv
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "operadores_raw.tsv"
OUT = HERE.parent / "Operadores.json"

# Heurística: primeras 2 palabras = apellidos, resto = nombres. Solo se usa
# cuando el campo NOMBRE no trae coma (formato ambiguo) -> se marca _revisar.
NAME_OVERRIDES = {
    # ID de fila (índice en la lista, 0-based) -> (ApellidoPaterno+Materno, Nombres)
    # Caso confirmado explícitamente por el usuario.
    0: ("Benitez Guzman", "Vicente Guillermo"),
}


NUM_RE = re.compile(r"\d[\d\s\-]{5,}\d")


def split_numero_run(raw):
    """Varios números en un mismo renglón sin separador de texto entre ellos
    (ej. "271 107 80 50 271 136 60 94") se parten en bloques de 10 dígitos.
    Un token contiguo sin espacios (ej. "442711318653") se deja intacto aunque
    tenga más de 10 dígitos: es un solo número, probablemente con prefijo."""
    digits = re.sub(r"\D", "", raw)
    has_separators = bool(re.search(r"[\s\-]", raw))
    if not has_separators or len(digits) <= 11:
        return [re.sub(r"\s+", " ", raw).strip()]
    return [digits[i : i + 10] for i in range(0, len(digits), 10)]


def parse_line_chunk(chunk):
    chunk = chunk.strip().strip(";").strip()
    if not chunk:
        return []
    matches = list(NUM_RE.finditer(chunk))
    if not matches:
        return [{"Numero": None, "Etiqueta": chunk}]
    out = []
    for i, m in enumerate(matches):
        numeros = split_numero_run(m.group())
        prefix = chunk[: m.start()].strip(" -:_/") if i == 0 else ""
        if i + 1 < len(matches):
            suffix = chunk[m.end() : matches[i + 1].start()].strip(" -:_/")
        else:
            suffix = chunk[m.end() :].strip(" -:_/")
        for j, numero in enumerate(numeros):
            if len(numeros) > 1:
                label = prefix if j == 0 else (suffix if j == len(numeros) - 1 else "")
            else:
                label = " ".join(x for x in [prefix, suffix] if x)
            out.append({"Numero": numero, "Etiqueta": label or None})
    return out


def parse_celulares(raw):
    if not raw or not raw.strip():
        return []
    line_groups = []
    for line in raw.split("\n"):
        line = line.strip()
        if not line:
            continue
        group = []
        for part in line.split(";"):
            group.extend(parse_line_chunk(part))
        if group:
            line_groups.append(group)

    # Formato alternado: renglón de etiqueta seguido de renglón con solo el
    # número (ej. "ANA KAREN CASTAÑEDA (ESPOSA)" / "2491341279"). Se fusionan.
    out = []
    i = 0
    while i < len(line_groups):
        group = line_groups[i]
        if (
            len(group) == 1
            and group[0]["Numero"] is None
            and group[0]["Etiqueta"]
            and i + 1 < len(line_groups)
        ):
            nxt = line_groups[i + 1]
            if len(nxt) == 1 and nxt[0]["Numero"] and not nxt[0]["Etiqueta"]:
                out.append({"Numero": nxt[0]["Numero"], "Etiqueta": group[0]["Etiqueta"]})
                i += 2
                continue
        out.extend(group)
        i += 1
    return out


def split_nombre(nombre_raw, idx):
    nombre_raw = re.sub(r"\s+", " ", nombre_raw.strip())
    if idx in NAME_OVERRIDES:
        apellidos, nombres = NAME_OVERRIDES[idx]
        return apellidos, nombres, None
    if not nombre_raw:
        return "", "", "Registro sin nombre capturado."
    if "," in nombre_raw:
        apellidos, _, nombres = nombre_raw.partition(",")
        return apellidos.strip(), nombres.strip(), None
    if " " not in nombre_raw:
        return nombre_raw, "", (
            "Nombre concatenado sin espacios ni coma — no se pudo separar "
            "apellido/nombre automáticamente."
        )
    words = nombre_raw.split(" ")
    if len(words) <= 2:
        return nombre_raw, "", "Nombre sin coma: solo una palabra de apellido, falta separar nombre(s)."
    apellidos = " ".join(words[:2])
    nombres = " ".join(words[2:])
    return apellidos, nombres, (
        "Nombre sin coma — apellidos/nombres separados con heurística "
        "(2 primeras palabras = apellidos), verificar orden correcto."
    )


def to_titlecase(s):
    return " ".join(w.capitalize() for w in s.split(" ")) if s else s


def norm_estado(s):
    s = s.strip()
    return s if s else None


NO_LICENCIA_VALUES = {"sin licencia registrada", "por validar."}


def build_licencia(licencia_raw):
    licencia_raw = (licencia_raw or "").strip()
    if not licencia_raw:
        return {
            "Tipo": None,
            "Numero": None,
            "FechaExpedicion": None,
            "FechaExpiracion": None,
            "Vigente": False,
        }
    vigente = licencia_raw.lower() not in NO_LICENCIA_VALUES
    return {
        "Tipo": licencia_raw,
        "Numero": None,
        "FechaExpedicion": None,
        "FechaExpiracion": None,
        "Vigente": vigente,
    }


def parse_bool_flag(raw):
    return (raw or "").strip() not in ("", "0")


def build_medico(medico_raw):
    return {
        "Vigente": parse_bool_flag(medico_raw),
        "FechaExamen": None,
        "FechaExpiracion": None,
    }


def norm_rfc(rfc_raw):
    rfc_raw = (rfc_raw or "").strip()
    return rfc_raw or None


def norm_comentarios(raw):
    raw = (raw or "").strip()
    return raw or None


def main():
    with open(SRC, "r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f, delimiter="\t", quotechar='"')
        rows = list(reader)

    header = rows[0]
    data_rows = rows[1:]

    operadores = []
    data_idx = 0
    for row in data_rows:
        if not any(c.strip() for c in row):
            continue
        row = row + [""] * (11 - len(row))
        id_raw, score_raw, estado_raw, nombre_raw, celulares_raw, licencia_raw, medico_raw, referencias_raw, rfc_raw, emails_raw, comentarios_raw = row[:11]

        apellidos, nombres, nombre_obs = split_nombre(nombre_raw, data_idx)

        operador = {
            "ID": int(id_raw) if id_raw.strip().isdigit() else None,
            "Score": 0.0,
            "Estado": norm_estado(estado_raw),
            "ApellidoPaterno": to_titlecase(apellidos),
            "ApellidoMaterno": "",
            "Nombres": to_titlecase(nombres),
            "Celulares": parse_celulares(celulares_raw),
            "Licencia": build_licencia(licencia_raw),
            "Medico": build_medico(medico_raw),
            "ReferenciasVerificadas": parse_bool_flag(referencias_raw),
            "RFC": norm_rfc(rfc_raw),
            "Emails": [e.strip() for e in emails_raw.split(",") if e.strip()],
            "Comentarios": norm_comentarios(comentarios_raw),
            "Observaciones": [],
        }
        if nombre_obs:
            operador["Observaciones"].append(nombre_obs)
        operadores.append(operador)
        data_idx += 1

    # --- Validaciones automáticas cruzadas: todo lo inconsistente se marca
    # con una observación y _revisar=true, sin bloquear la generación. ---
    from collections import defaultdict

    by_id = defaultdict(list)
    for o in operadores:
        if o["ID"] is not None:
            by_id[o["ID"]].append(o)
    for id_, group in by_id.items():
        if len(group) > 1:
            for o in group:
                otros = [g for g in group if g is not o]
                nombres_otros = ", ".join(f"{g['ApellidoPaterno']} {g['Nombres']}".strip() for g in otros)
                o["Observaciones"].append(f"ID {id_} duplicado con otro registro: {nombres_otros}.")

    by_rfc = defaultdict(list)
    for o in operadores:
        if o["RFC"]:
            by_rfc[o["RFC"]].append(o)
    for rfc, group in by_rfc.items():
        nombres_set = {(g["ApellidoPaterno"], g["Nombres"]) for g in group}
        if len(group) > 1 and len(nombres_set) > 1:
            for o in group:
                otros = [g for g in group if g is not o]
                nombres_otros = ", ".join(f"{g['ApellidoPaterno']} {g['Nombres']}".strip() for g in otros)
                o["Observaciones"].append(
                    f"RFC {rfc} repetido en otro registro con nombre distinto: {nombres_otros}."
                )

    by_phone = defaultdict(list)
    for o in operadores:
        for c in o["Celulares"]:
            digits = re.sub(r"\D", "", c["Numero"] or "")
            if len(digits) >= 8:
                by_phone[digits].append(o)
    for digits, group in by_phone.items():
        uniq = list({id(o): o for o in group}.values())
        if len(uniq) > 1:
            for o in uniq:
                otros = [g for g in uniq if g is not o]
                nombres_otros = ", ".join(f"{g['ApellidoPaterno']} {g['Nombres']}".strip() or "(sin nombre)" for g in otros)
                o["Observaciones"].append(f"Teléfono repetido en otro registro: {nombres_otros}.")

    for o in operadores:
        if o["Observaciones"]:
            o["_revisar"] = True

    out = {
        "_meta": {
            "descripcion": "Catálogo maestro de operadores — Transportes Ráfagas del Golfo S.A. de C.V.",
            "version": "1.0.0",
            "fuente": "Migrado desde tabla de operadores (captura manual)",
            "total": len(operadores),
            "notas": [
                "Score en 0.0 para todos los registros: la calificación 0-100 real aún no se ha capturado; los valores previos (1, 1a, 1b, 2a) eran códigos de otro tipo, no la calificación.",
                "_revisar=true indica que ApellidoPaterno/Nombres se separaron con una heurística (2 primeras palabras = apellidos) sobre un campo NOMBRE sin coma, y debe confirmarse a mano.",
                "ApellidoMaterno se deja vacío: el dato de origen no distingue paterno/materno de forma confiable, todo el apellido compuesto quedó en ApellidoPaterno.",
            ],
        },
        "operadores": {
            "_descripcion": "Operadores registrados con su score, estado, licencia, examen médico y datos de contacto.",
            "datos": operadores,
        },
    }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Escrito {OUT} con {len(operadores)} operadores.")
    print(f"Marcados _revisar=true: {sum(1 for o in operadores if o.get('_revisar'))}")


if __name__ == "__main__":
    main()
