# Données de quizz (JSON) — Structure, Schémas, Qualité

## 1) Organisation disque

```
QUIZZ/
 ├─ <quizIdA>/
 │   ├─ Quizz-fr.json
 │   ├─ Quizz-en.json
 │   └─ Images.json
 └─ <quizIdB>/
     └─ ...
```

- **Nom du quizz = nom du dossier.**
- `Quizz-fr.json` et `Quizz-en.json` partagent **les mêmes IDs de questions et d’images**.
- `Images.json` regroupe des PNG base64 avec un `id` référencé dans les quizz.

## 2) Contrats de données

```ts
export interface ImageRef { id: string; png_base64: string; }

export interface QuizAnswer {
  statement: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: number;
  statement: string;
  guidelines?: string;
  image_ids: string[];
  answers: QuizAnswer[];
  explanation: string;
  Source_URL: string[];
}

export interface QuizFile {
  questionnaire: QuizQuestion[];
}
```

## 3) JSON Schema (AJV)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "QuizFile",
  "type": "object",
  "required": ["questionnaire"],
  "properties": {
    "questionnaire": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "statement", "answers", "explanation", "Source_URL", "image_ids"],
        "properties": {
          "id": { "type": "integer", "minimum": 1 },
          "statement": { "type": "string", "minLength": 1 },
          "guidelines": { "type": "string" },
          "image_ids": {
            "type": "array",
            "items": { "type": "string", "minLength": 1 },
            "uniqueItems": true
          },
          "answers": {
            "type": "array",
            "minItems": 2,
            "items": {
              "type": "object",
              "required": ["statement", "is_correct"],
              "properties": {
                "statement": { "type": "string", "minLength": 1 },
                "is_correct": { "type": "boolean" }
              },
              "additionalProperties": false
            }
          },
          "explanation": { "type": "string", "minLength": 1 },
          "Source_URL": {
            "type": "array",
            "items": { "type": "string", "format": "uri" },
            "uniqueItems": true
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

### Contraintes & Règles métier
- `id` **unique** par question et **identique** entre `fr`/`en`.
- `answers` doit contenir au moins **une** bonne réponse ; **plusieurs** possibles.
- Les `image_ids` référencés doivent exister dans `Images.json`.
- Les URLs de `Source_URL` sont **cliquables** en UI (ouvrir dans un nouvel onglet).
- Tous les fichiers `QUIZZ` sont **chargés une seule fois au démarrage** ; pas de lazy‑loading.

## 4) `Images.json` (contrat)

```json
[
  { "id": "img_00001", "png_base64": "iVBORw0KGgoAAA...==" }
]
```

### Chargement & Affichage
- Décoder en `Blob`/`ObjectURL` pour `<img>` (éviter l’injection).
- Mettre en cache `id -> dataURL` dans le store global.

## 5) Exemple minimal
Utiliser l’exemple fourni dans les notes (structure et clés) pour démarrer un nouveau quizz.
