# Bittu's ML board

A playable machine-learning primer in Astro, in the style of *The Evolution of Trust*: you can't
read your way forward, you have to beat the mini-game in each chapter to unlock the next one.
**Bittu** is the pet in the corner — click any underlined word and he explains it, and he reacts to
what you do in every game.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/ — drop it on any static host
```

No backend, no database. Progress is kept in `localStorage` under `bittu-ml-v1`.

## What's in the board

| # | Chapter | Mini-game | The thing it teaches |
|---|---------|-----------|----------------------|
| 1 | What is machine learning? | Write a classification rule by hand with two sliders, then let Bittu brute-force 891 rules in milliseconds | "Learned from data" = searched for, not typed in. Also: the best rule still gets one wrong |
| 2 | Supervised learning | You label six messages junk/real; Bittu builds word weights from *your* labels and grades three unseen ones | Labelled data, X → Y, garbage in / garbage out |
| 3 | Regression | Drag slope and intercept to fit a house-price line; a button runs actual gradient descent on the same sliders | Continuous output, squared error, training as downhill walking |
| 4 | Classification | Tilt a decision boundary until it separates pass/fail students; misclassified points get red rings | Categorical output, decision boundary, why accuracy can lie |
| 5 | Unsupervised learning | Run k-means one step at a time — drop centroids, assign, move, repeat until nothing changes | No labels anywhere, structure found by distance, *you* pick k and name the groups |
| 6 | Data + algorithm → model | Slide polynomial degree from 1 to 9 and watch train error and test error come apart, then ship one | What a model is, overfitting vs underfitting, why the test set is the only honest score |

Finishing chapter 6 unlocks a "what's next" section mapped to
[roadmap.sh/machine-learning](https://roadmap.sh/machine-learning).

## Structure

```
src/
  layouts/Base.astro          # HUD (progress, bones) + Bittu dock
  components/
    Bittu.astro               # the pet: SVG, moods, eyes that follow the cursor
    Term.astro                # <Term def="...">word</Term> → Bittu explains it
    Chapter.astro             # locked/unlocked section wrapper
    games/*.astro             # one file per mini-game, markup + logic together
  scripts/game.js             # progress store, speech queue, canvas helpers
  styles/global.css           # marker-on-a-dark-board theme
```

## Adding chapter 7

1. Bump `TOTAL` in `src/scripts/game.js`.
2. Make `src/components/games/YourGame.astro`; call `win(7, 'message')` when the player succeeds
   and `say('...', 'think' | 'happy' | 'oops' | 'party')` whenever Bittu should speak.
3. Drop a `<Chapter n={7} …>` into `src/pages/index.astro` and point the previous chapter's
   `next` prop at it.

The rule that keeps this from turning into a slide deck: **every chapter needs a thing the player
can be wrong about.** If a concept can't be made wrong, it belongs in a `<Term>` tooltip, not a
chapter.
