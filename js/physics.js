import { TILES } from './config.js';
import { isOutside, shiftForResize } from './layout.js';
import { shuffle } from './rules.js';

const { Engine, Bodies, Body, Composite, Constraint, Vector } = Matter;

const TAP_MAX_MOVE = 6;
const TAP_MAX_MS = 300;
const MAX_SPEED = 40;
const WALL = 200;
const STEP_MS = 1000 / 60;
const SPEED_WINDOW_MS = 80;
const COLLIDE_ALL = 0xffffffff;
// Respawned tiles fall back into a narrow zone in the middle.
const NAME_DROP = 0.45;
// Time for the bag to swing in before the first tile drops, then one tile per interval.
const POUR_LEAD_MS = 700;
const POUR_INTERVAL_MS = 160;

export function createPhysics(initialLayout, callbacks, inputEl, tileDefs = TILES) {
  const engine = Engine.create();
  engine.positionIterations = 10;
  engine.velocityIterations = 8;

  let layout = initialLayout;
  let inputEnabled = true;
  let bounds = [];
  let pointer = null;
  let drag = null;

  let tiles = [];
  const byId = (id) => tiles.find((tile) => tile.id === id);
  // Tiles flying into a shape: each eases from its position to a target.
  let shape = null;
  // Tiles still inside the bag, in the random order they will drop out.
  let bagQueue = [];
  let pourWait = 0;
  buildBounds();
  addTiles(tileDefs);

  function addTiles(defs) {
    const added = defs.map((def) => ({ ...def, body: createTileBody(layout.tileSize), snappedField: null, visible: false }));
    tiles = [...tiles, ...added];
    for (const tile of added) {
      Body.setStatic(tile.body, true);
      tile.body.collisionFilter.mask = 0;
    }
    Composite.add(engine.world, added.map((t) => t.body));
    if (bagQueue.length === 0) {
      pourWait = POUR_LEAD_MS;
      callbacks.onPourStart?.();
    }
    bagQueue = [...bagQueue, ...shuffle(added)];
  }

  function dropFromBag(tile) {
    const { bagX, bagY, tileSize } = layout;
    tile.visible = true;
    Body.setStatic(tile.body, false);
    tile.body.collisionFilter.mask = COLLIDE_ALL;
    Body.setPosition(tile.body, { x: bagX + (Math.random() - 0.5) * tileSize * 0.4, y: bagY + tileSize * 0.6 });
    Body.setAngle(tile.body, Math.random() * Math.PI * 2);
    Body.setVelocity(tile.body, { x: (Math.random() - 0.5) * 8, y: 5 + Math.random() * 3 });
    Body.setAngularVelocity(tile.body, (Math.random() - 0.5) * 0.6);
  }

  function pour(deltaMs) {
    if (bagQueue.length === 0) return;
    pourWait -= deltaMs;
    while (pourWait <= 0 && bagQueue.length > 0) {
      dropFromBag(bagQueue.shift());
      pourWait += POUR_INTERVAL_MS;
    }
    if (bagQueue.length === 0) callbacks.onPourEnd?.();
  }

  function createTileBody(size) {
    return Bodies.rectangle(0, 0, size, size, {
      chamfer: { radius: size * 0.1 },
      restitution: 0.15,
      friction: 0.6,
      frictionAir: 0.012,
      density: 0.002,
    });
  }

  function buildBounds() {
    Composite.remove(engine.world, bounds);
    const { width, height, floorY } = layout;
    bounds = [
      Bodies.rectangle(width / 2, floorY + WALL / 2, width + 2 * WALL, WALL, { isStatic: true }),
      Bodies.rectangle(-WALL / 2, 0, WALL, height * 4, { isStatic: true }),
      Bodies.rectangle(width + WALL / 2, 0, WALL, height * 4, { isStatic: true }),
    ];
    Composite.add(engine.world, bounds);
  }

  function placeAbove(tile, order, slot = tile.id % TILES.length, slots = TILES.length, spanFraction = NAME_DROP) {
    const { width, tileSize } = layout;
    const span = width * spanFraction;
    const x = (width - span) / 2 + (span * (slot + 0.5)) / slots + (Math.random() - 0.5) * tileSize * 0.6;
    Body.setStatic(tile.body, false);
    Body.setPosition(tile.body, { x, y: -tileSize * (1 + order * 0.7) });
    Body.setAngle(tile.body, (Math.random() - 0.5) * 0.8);
    Body.setVelocity(tile.body, { x: 0, y: 0 });
    Body.setAngularVelocity(tile.body, 0);
  }

  function scaleBody(body, factor) {
    // Static bodies restore their pre-scale mass when released, so scale them as dynamic ones.
    const wasStatic = body.isStatic;
    if (wasStatic) Body.setStatic(body, false);
    Body.scale(body, factor, factor);
    if (wasStatic) Body.setStatic(body, true);
  }

  function fieldCenter(index) {
    const rect = layout.fieldRects[index];
    return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
  }

  function snap(tileId, fieldIndex) {
    const tile = byId(tileId);
    tile.snappedField = fieldIndex;
    Body.setStatic(tile.body, true);
    // Snapped tiles sit in the rack behind the scene; loose tiles pass in front.
    tile.body.collisionFilter.mask = 0;
    Body.setAngle(tile.body, 0);
    Body.setPosition(tile.body, fieldCenter(fieldIndex));
  }

  function unsnap(tileId) {
    const tile = byId(tileId);
    if (tile.snappedField === null) return;
    tile.snappedField = null;
    Body.setStatic(tile.body, false);
    tile.body.collisionFilter.mask = COLLIDE_ALL;
    Body.setVelocity(tile.body, { x: 0, y: 0 });
  }

  function pickTile(point) {
    let best = null;
    let bestDistance = Infinity;
    for (const tile of tiles) {
      if (!tile.visible) continue;
      const dx = Math.abs(point.x - tile.body.position.x);
      const dy = Math.abs(point.y - tile.body.position.y);
      if (Math.max(dx, dy) > layout.hitSize / 2) continue;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        best = tile;
        bestDistance = distance;
      }
    }
    return best;
  }

  function toLocal(event) {
    const rect = inputEl.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDrag(tile, point) {
    callbacks.onGrab?.(tile.id);
    const body = tile.body;
    drag = {
      tile,
      constraint: Constraint.create({
        pointA: point,
        bodyB: body,
        pointB: Vector.sub(point, body.position),
        angleB: body.angle,
        stiffness: 0.2,
        damping: 0.1,
        length: 0,
      }),
    };
    Composite.add(engine.world, drag.constraint);
  }

  function pointerSpeed(samples) {
    const last = samples.at(-1);
    const first = samples.find((sample) => last.t - sample.t <= SPEED_WINDOW_MS) ?? last;
    const elapsed = last.t - first.t;
    return elapsed > 0 ? Math.hypot(last.x - first.x, last.y - first.y) / elapsed : 0;
  }

  function endDrag(notify) {
    if (!drag) return;
    // A cancelled drag must not be picked up again by the next pointermove.
    if (!notify && pointer) pointer.tile = null;
    Composite.remove(engine.world, drag.constraint);
    const { id } = drag.tile;
    drag = null;
    if (!notify) return;
    const last = pointer.samples.at(-1);
    callbacks.onRelease?.(id, { x: last.x, y: last.y, speed: pointerSpeed(pointer.samples) });
  }

  function addSample(point) {
    const t = performance.now();
    pointer.samples = [...pointer.samples.filter((sample) => t - sample.t <= SPEED_WINDOW_MS * 2), { ...point, t }];
  }

  inputEl.addEventListener('pointerdown', (event) => {
    if (!inputEnabled || pointer) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const point = toLocal(event);
    inputEl.setPointerCapture(event.pointerId);
    pointer = { id: event.pointerId, start: point, startedAt: performance.now(), tile: pickTile(point), samples: [] };
    addSample(point);
  });

  inputEl.addEventListener('pointermove', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const point = toLocal(event);
    addSample(point);
    if (drag) {
      drag.constraint.pointA = point;
      return;
    }
    const moved = Math.hypot(point.x - pointer.start.x, point.y - pointer.start.y);
    if (pointer.tile && inputEnabled && moved > TAP_MAX_MOVE) startDrag(pointer.tile, point);
  });

  function onPointerEnd(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const point = toLocal(event);
    addSample(point);
    const elapsed = performance.now() - pointer.startedAt;
    if (drag) {
      endDrag(inputEnabled);
    } else if (inputEnabled && pointer.tile && elapsed < TAP_MAX_MS) {
      callbacks.onTap?.(pointer.tile.id);
    } else if (inputEnabled && !pointer.tile) {
      callbacks.onBackgroundGesture?.(point.x - pointer.start.x, point.y - pointer.start.y);
    }
    pointer = null;
  }

  inputEl.addEventListener('pointerup', onPointerEnd);
  inputEl.addEventListener('pointercancel', (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    endDrag(false);
    pointer = null;
  });

  function moveIntoShape(deltaMs) {
    if (!shape) return;
    shape.elapsed = Math.min(shape.elapsed + deltaMs, shape.duration);
    const t = shape.elapsed / shape.duration;
    const eased = 1 - (1 - t) ** 3;
    for (const { tile, from, to, angle } of shape.items) {
      Body.setPosition(tile.body, { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased });
      Body.setAngle(tile.body, angle * (1 - eased));
    }
  }

  function step(deltaMs) {
    pour(deltaMs);
    moveIntoShape(deltaMs);
    Engine.update(engine, deltaMs);
    tiles.forEach((tile, i) => {
      const { body } = tile;
      if (body.isStatic) return;
      if (Body.getSpeed(body) > MAX_SPEED) Body.setSpeed(body, MAX_SPEED);
      if (tile.visible && isOutside(body.position.x, body.position.y, layout)) {
        if (drag?.tile === tile) endDrag(false);
        placeAbove(tile, 0);
      }
    });
  }

  return {
    step,
    snap,
    unsnap,
    tileStates() {
      return tiles.map((tile) => ({
        id: tile.id,
        letter: tile.letter,
        x: tile.body.position.x,
        y: tile.body.position.y,
        angle: tile.body.angle,
        snappedField: tile.snappedField,
        visible: tile.visible,
        color: tile.color ?? null,
      }));
    },
    relayout(next) {
      const before = layout;
      const factor = next.tileSize / before.tileSize;
      layout = next;
      buildBounds();
      for (const tile of tiles) {
        if (factor !== 1) scaleBody(tile.body, factor);
        if (tile.snappedField !== null) {
          Body.setPosition(tile.body, fieldCenter(tile.snappedField));
          continue;
        }
        // Loose tiles move with the floor instead of raining in again.
        Body.setPosition(tile.body, shiftForResize(tile.body.position, before, layout));
        if (isOutside(tile.body.position.x, tile.body.position.y, layout)) placeAbove(tile, 0);
      }
    },
    setInputEnabled(enabled) {
      inputEnabled = enabled;
      if (!enabled) endDrag(false);
    },
    setTilesVisible(ids, visible) {
      for (const id of ids) {
        const tile = byId(id);
        tile.visible = visible;
        // Hidden tiles must not collide with the visible ones.
        tile.body.collisionFilter.mask = visible && tile.snappedField === null ? COLLIDE_ALL : 0;
        if (!visible) Body.setStatic(tile.body, true);
      }
    },
    dropTiles(ids) {
      ids.forEach((id, order) => placeAbove(byId(id), order));
    },
    // Launches every snapped tile out of the rack; calm keeps them from flying.
    blast(calm) {
      for (const tile of tiles) {
        if (tile.snappedField === null) continue;
        unsnap(tile.id);
        if (calm) continue;
        Body.setVelocity(tile.body, { x: (Math.random() - 0.5) * 28, y: -12 - Math.random() * 12 });
        Body.setAngularVelocity(tile.body, (Math.random() - 0.5) * 0.8);
      }
    },
    addTiles(defs) {
      addTiles(defs);
    },
    removeTiles(ids) {
      const removed = tiles.filter((tile) => ids.includes(tile.id));
      Composite.remove(engine.world, removed.map((tile) => tile.body));
      tiles = tiles.filter((tile) => !ids.includes(tile.id));
      bagQueue = bagQueue.filter((tile) => !ids.includes(tile.id));
    },
    // Kicks loose tiles upwards like a cheering crowd.
    hop() {
      for (const tile of tiles) {
        if (!tile.visible || tile.snappedField !== null || tile.body.isStatic) continue;
        Body.setVelocity(tile.body, { x: (Math.random() - 0.5) * 4, y: -5 - Math.random() * 7 });
        Body.setAngularVelocity(tile.body, (Math.random() - 0.5) * 0.4);
      }
    },
    // targets: {id, x, y}[]; tiles stop colliding and ease into place.
    formShape(targets, durationMs) {
      const items = targets.map(({ id, x, y }) => {
        const tile = byId(id);
        Body.setStatic(tile.body, true);
        tile.body.collisionFilter.mask = 0;
        return { tile, from: { ...tile.body.position }, to: { x, y }, angle: tile.body.angle };
      });
      shape = { items, elapsed: 0, duration: durationMs };
    },
    releaseShape() {
      if (!shape) return;
      for (const { tile } of shape.items) {
        Body.setStatic(tile.body, false);
        tile.body.collisionFilter.mask = COLLIDE_ALL;
        Body.setVelocity(tile.body, { x: (Math.random() - 0.5) * 3, y: Math.random() * 2 });
        Body.setAngularVelocity(tile.body, (Math.random() - 0.5) * 0.3);
      }
      shape = null;
    },
    reset(defs) {
      endDrag(false);
      pointer = null;
      Composite.remove(engine.world, tiles.map((t) => t.body));
      tiles = [];
      bagQueue = [];
      shape = null;
      addTiles(defs);
    },
    settle() {
      for (let i = 0; i < 600; i++) step(STEP_MS);
    },
  };
}
