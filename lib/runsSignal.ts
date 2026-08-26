let dirty = false;

export function markRunsDirty() {
  dirty = true;
}

export function consumeRunsDirty() {
  const wasDirty = dirty;
  dirty = false;
  return wasDirty;
}
