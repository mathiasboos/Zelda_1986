# Ashvale — The Sundered Sigil

A top-down action adventure in the mould of the 1986 originals: a
screen-by-screen overworld, sword-and-shield combat, item-gated exploration,
key-and-lock dungeons, and a shattered relic to put back together.

No build step, no dependencies, no install. Open `index.html` and play.

```
git clone <this repo> && cd Test
open index.html          # macOS · or xdg-open, or just double-click it
```

---

## The story

Ashvale was lit by the **Sigil of Dawn** until **Morvane, the Ashen King**, broke
it and let the grey in. The seer **Vellamor** scattered the five shards into the
old barrows before he took her, so that he could never hold the Sigil whole.

You are **Kaelen**, a lantern-bearer. Walk the barrows. Gather the shards. Put
out the Ashen King.

## Controls

| | |
|---|---|
| Move | Arrow keys or WASD |
| Blade | `Z` / `J` / Space |
| Item | `X` / `K` / Shift |
| Subscreen (choose your item) | `Enter` |
| Sound on/off | `Tab` |

A gamepad works too. Progress saves to one of three slots as you go.

At full embers the blade throws its heat down the room — the reason to keep your
health topped up is that it changes how you fight, not just how long you live.

## What's in it

- **30 overworld screens** across five regions: the Emberwood, the Mire, the
  Ashen Crags, the Saltflats and the Barrowdowns.
- **Five barrows**, 53 rooms: the Hollow of Roots, the Salt Crypt, the Drowned
  Barrow, the Crag Vault, and the Ashen Lair.
- **13 enemies**, each with its own behaviour — Grublings that spit, Burrowers
  that come up behind you, Ironwards whose plate turns anything struck at their
  face, Gorgers that swallow you and eat your shield, Wallcrawlers that put you
  back at the door.
- **Five bosses**, each withholding something until you work out its rule. The
  Twin Maws only ever bleed from the inside. The Hollow Choir opens its eye for
  exactly one thing. Morvane stops being solid halfway through.
- **Eleven items**, three shops, hidden caves behind burnt brush and blasted
  rock, Ember Vessels to find, and a wager you will probably lose.

Roughly 45–60 minutes if you know where you are going, and rather longer if you
don't — which is the point.

## Getting started (mild spoilers)

The Hermit's cave is on your starting screen; he gives you the blade. The first
barrow is south-west of there. After that, the shape of it is: each barrow holds
the thing that opens the way to the next.

<details>
<summary>The full route, if you get stuck</summary>

1. **Ember Blade** — the Hermit's cave, on the starting screen.
2. **Barrow I, the Hollow of Roots** — south-west, in the Emberwood. Gives the
   **Ricochet Stone**.
3. **Blastroot** — buy it from the pedlar out on the Saltflats.
4. **Barrow II, the Salt Crypt** — behind a cracked rock in the far south-east.
   Gives the **Thornbow**.
5. **Reed Raft** — a blasted cave in the Saltflats.
6. **Barrow III, the Drowned Barrow** — on an island in the Mire; raft across
   from the dock. Gives the **Firebrand Torch**.
7. **Windcaller Horn** — behind burnt brush in the Ashen Crags.
8. **Barrow IV, the Crag Vault** — sound the Horn outside it. Gives the
   **Grapple Vine**.
9. **The Ashen Lair** — across the chasm in the Barrowdowns. The door wants all
   four shards; the fifth is inside, and so is Morvane.

Some rock is cracked, and some brush burns. The Hermit's other fires will tell
you which, if you ask.
</details>

## Layout

```
index.html            canvas and the ordered script tags
style.css             page chrome
src/core/             gfx, font, art lookup, input, audio, save, the loop
src/data/             sprites, tiles, the overworld, the barrows, caves, text
src/world/            world.js (places and tiles) · play.js (entities, collisions)
src/entity/           player, enemies, bosses, projectiles, pickups
src/ui/               hud, menus
tools/                validate · verify · build
```

Sources load as **classic script tags, not ES modules**. That is deliberate:
modules are blocked by CORS on `file://` origins, so a module build would fail
the moment someone double-clicked the file. Everything hangs off one global,
`AV`.

Pixel art lives in `src/data/sprites.js` as palette-indexed character rows, so
there are no binary assets to lose track of. Tiles are painted procedurally per
region, which is why a field of grass reads as texture rather than one stamp
repeated ninety times.

## Tools

```bash
node tools/validate.js   # proves the game can actually be finished
node tools/verify.js     # drives the real game in Chromium, screenshots each beat
node tools/build.js      # packs everything into one file: dist/ashvale.html
```

`validate.js` is the one worth knowing about. It does not check that the game
loads — it checks that it can be **beaten**: that every screen edge lines up with
its neighbour, that no secret is walled inside its own thicket where nothing can
reach it, that every barrow's item, Seal and boss are reachable from its entrance
with the keys actually available inside it, and that a fixed-point search over
the whole world — gaining items as it reaches them — eventually opens the Lair.

Both were worth having. `validate.js` caught three caves sealed inside bush
clusters with no way to stand next to them, which would have made the game
unfinishable. `verify.js` caught keypresses being dropped between simulation
steps, and a raft that landed on the dock it set out from.

## On originality

Game mechanics and genre conventions are not protectable, and this deliberately
borrows the shape of a well-known 1986 game: the screen-by-screen overworld, the
hearts, the item-gated dungeons.

Everything expressive is original and written from scratch for this project —
the title, the world, the story, every character, item and enemy name, all pixel
art (authored by hand as sprite data, nothing traced or ripped), and all six
pieces of music. No Nintendo asset, name, character, map or melody is reproduced
here.
