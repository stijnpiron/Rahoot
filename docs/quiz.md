# Quiz Configuration

Quizzes live in `config/quizz/*.json`, see [Configuration](configuration.md).

Quizzes can be created in two ways:

- **Via the Quiz Editor**: use the built-in editor available in the manager dashboard (recommended)
- **Via JSON files**: manually create files in the `config/quizz/` directory

You can have multiple quiz files and select which one to use when starting a game.

Example quiz configuration (`config/quizz/example.json`):

```json
{
  "gameMode": "quiz",
  "subject": "Example Quiz",
  "questions": [
    {
      "question": "What is the correct answer?",
      "answers": ["No", "Yes", "No", "No"],
      "solutions": [1],
      "cooldown": 5,
      "time": 15
    },
    {
      "question": "Which of these are primary colors?",
      "answers": ["Red", "Green", "Blue", "Yellow"],
      "solutions": [0, 2, 3],
      "cooldown": 5,
      "time": 20
    },
    {
      "question": "What is the correct answer with an image?",
      "answers": ["No", "Yes", "No", "No"],
      "media": {
        "type": "image",
        "url": "https://placehold.co/600x400.png"
      },
      "solutions": [1],
      "cooldown": 5,
      "time": 20
    }
  ]
}
```

Quiz Options:

- `gameMode`: `"quiz"` (default) or `"survey"`, see [Survey mode](#survey-mode)
- `subject`: Title/topic of the quiz
- `questions`: Array of question objects containing:
  - `type`: `"single"` (exactly one answer), `"multi"` (one or more), `"estimation"` (a number, see [Estimation questions](#estimation-questions)), `"trueFalse"` (see [True/False questions](#truefalse-questions)), `"puzzle"` (see [Puzzle questions](#puzzle-questions)) or `"pin"` (see [Pin questions](#pin-questions)). Defaults to `"single"` when omitted
  - `question`: The question text
  - `category`: Optional round name, see [Categories](#categories)
  - `note`: Optional explanation shown on the main screen when the answer is revealed, e.g. `"Red, green and blue are the primary colors of light"`
  - `answers`: Array of possible answers (2-4 options)
  - `media`: Optional media object displayed with the question:
    - `type`: `"image"`, `"video"`, or `"audio"`
    - `url`: URL of the media, either a full `http(s)://` URL or a `/media/...` path for a file uploaded from the editor (stored in `config/media`)
  - `solutions`: Array of correct answer indices (0-based). Use multiple indices for multi-answer questions. Required in `"quiz"` mode, omitted in `"survey"` mode
  - `cooldown`: Time in seconds before answers are revealed (3-15)
  - `time`: Time in seconds allowed to answer (5-120)
  - `maxPoints`: Maximum points awarded for a correct answer (default: `1000`, min: `0`)
  - `penalty`: Points deducted for a wrong answer (default: none, min: `0`). The player's total cannot go below 0. Unanswered questions are not penalised.
  - `options.scoringMode`: For `"multi"` questions only — `"strict"` (full points only if the selection matches exactly), `"balanced"` (correct picks minus wrong ones, the default) or `"lenient"` (points per correct pick, no penalty for wrong ones)

## Estimation questions

An `"estimation"` question asks for a number instead of offering answers to pick from, e.g. "How many days does a fly live?". Players answer with a slider or by typing a number, and are scored on how close they get, not on how fast they answer:

```json
{
  "type": "estimation",
  "question": "How many days does a fly live?",
  "answers": [],
  "solutions": [28],
  "options": {
    "inputMode": "slider",
    "min": 0,
    "max": 60,
    "step": 1,
    "margin": 5
  },
  "cooldown": 5,
  "time": 30
}
```

- `answers`: Always an empty array
- `solutions`: A one-element array holding the expected value, between `min` and `max`. Required in `"quiz"` mode, omitted in `"survey"` mode
- `options.inputMode`: `"slider"` (pick a value between the bounds) or `"input"` (type a number between the bounds)
- `options.min` / `options.max`: Bounds of the accepted values, `max` must be greater than `min`
- `options.step`: Precision of the slider (must be greater than 0)
- `options.margin`: How far from the expected value an answer still counts as correct. An exact answer earns `maxPoints`, an answer at the edge of the margin earns half of it, and anything further away earns nothing (and the `penalty`, if any). A margin of `0` only accepts the exact value

## True/False questions

A `"trueFalse"` question shows two fixed buttons, True and False, localized for every player. The only setting is which side is correct:

```json
{
  "type": "trueFalse",
  "question": "A fly lives longer than a year.",
  "answers": ["true", "false"],
  "solutions": [1],
  "cooldown": 5,
  "time": 15
}
```

- `answers`: Always exactly `["true", "false"]`. These are canonical keys — the UI shows localized labels, never this raw text
- `solutions`: Exactly one index, `0` for True or `1` for False. Required in `"quiz"` mode, omitted in `"survey"` mode (a true/false survey is a binary poll)

## Puzzle questions

A `"puzzle"` question shows shuffled tiles that players drag into the correct order. The stored `answers` order is the solution — there is no `solutions` array:

```json
{
  "type": "puzzle",
  "question": "Order these from smallest to largest",
  "answers": ["Ant", "Cat", "Dog"],
  "cooldown": 5,
  "time": 30,
  "maxPoints": 1000
}
```

- `answers`: 2 to 8 non-empty tiles, stored in the correct order. Every player sees the same shuffle for a question
- `solutions`: Not used, do not set it
- Scoring: each correctly placed tile earns a share of the points; a fully correct order earns `maxPoints`. A wrong tile earns nothing extra but correct tiles still count, so a mostly-right order scores partial points
- Survey mode: not supported

## Pin questions

A `"pin"` question shows an image and players drop a single pin on it. One author-drawn area (rectangle, circle, or freehand polygon) marks the correct region:

```json
{
  "type": "pin",
  "question": "Where is the Eiffel Tower?",
  "answers": [],
  "media": { "type": "image", "url": "/media/paris.png" },
  "cooldown": 5,
  "time": 30,
  "maxPoints": 1000,
  "options": {
    "area": { "kind": "circle", "cx": 0.5, "cy": 0.5, "r": 0.2 }
  }
}
```

- `media`: required, must be an image. This is the question's single media slot
- `options.area`: the correct area in normalized image coordinates (0-1 on both axes). `kind` is `"rect"` (`x`, `y`, `w`, `h`), `"circle"` (`cx`, `cy`, `r`) or `"freehand"` (`points`, at least 3). Required in quiz mode, optional in survey mode. Pins inside the area earn full points, pins outside earn nothing
- `solutions`: Not used, do not set it
- Survey mode: allowed with no area, e.g. a "where are you from?" poll; the reveal shows all named pins

## Categories

By default the leaderboard is shown after every question. To play in rounds instead, give consecutive questions the same `category`: the leaderboard is then skipped inside the round and only shown when the category changes, with the score movement of the whole round.

```json
{ "question": "What is Canada's capital?", "category": "Geography", ... },
{ "question": "What is the longest river?", "category": "Geography", ... },
{ "question": "Who sang Thriller?", "category": "Music", ... }
```

Here the leaderboard appears once after the two geography questions, and the music question goes straight to the podium as the last one.

- Questions without a `category` keep showing the leaderboard after each question
- A round is a run of consecutive questions: a category that comes back later in the quiz starts a new round
- Categories have no effect in `"survey"` mode, which has no leaderboard

> **Note:** the app automatically adds and manages an `id` field inside each quiz file the first time it's loaded — you don't need to set it yourself, and editing it manually may cause conflicts if it collides with another quiz's id.

## Survey mode

A quiz with `"gameMode": "survey"` collects opinions instead of testing knowledge: there is no scoring, no leaderboard and no podium, and no answer is correct. The host still controls the pace and still sees how the answers are distributed after each question, but players see neither points nor a rank, and the game ends on a summary screen rather than a podium.

Because a survey question has no right answer, `solutions` is left out entirely, and the scoring fields (`maxPoints`, `penalty`, `options.scoringMode`) are ignored:

```json
{
  "gameMode": "survey",
  "subject": "Sprint retro",
  "questions": [
    {
      "type": "single",
      "question": "How did this sprint feel?",
      "answers": ["Great", "Fine", "Hard", "Very hard"],
      "cooldown": 5,
      "time": 20
    },
    {
      "type": "multi",
      "question": "What slowed you down the most?",
      "answers": ["Meetings", "Unclear specs", "CI", "Reviews"],
      "cooldown": 5,
      "time": 30
    }
  ]
}
```

`type` keeps its meaning in a survey: it decides whether a player may pick several answers, not how they are scored.

The mode belongs to the quiz rather than to a single game, because whether the questions have right answers is a property of the content. Switching an existing quiz to survey mode in the editor keeps its `solutions` on file so you can switch back; they are simply never sent to the clients while the mode is `"survey"`. A quiz without `gameMode` is read as `"quiz"`, so files written before this option keep working untouched.
