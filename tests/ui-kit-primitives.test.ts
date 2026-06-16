import { describe, it, expect } from 'vitest';
import { UI_KIT, PRIMITIVE_NAMES } from '../src/render/ui-kit/index.js';

describe('ui-kit + primitive-names registry', () => {
  it('UI_KIT keys exactly match PRIMITIVE_NAMES', () => {
    const kitKeys = Object.keys(UI_KIT).sort();
    const schemaNames = [...PRIMITIVE_NAMES].sort();
    expect(kitKeys).toEqual(schemaNames);
  });

  it('UI_KIT contains all expected primitives', () => {
    const expected = [
      'panel',
      'card',
      'bento-grid',
      'stat-tile',
      'bar-chart',
      'line-chart',
      'donut-chart',
      'sidebar-nav',
      'table',
      'kanban-column',
      'chat-bubble',
      'input-field',
      'button',
      'toggle',
    ];
    for (const name of expected) {
      expect(UI_KIT).toHaveProperty(name);
    }
  });

  it('each UI_KIT value is a React component (function or class)', () => {
    for (const [name, component] of Object.entries(UI_KIT)) {
      expect(typeof component === 'function').toBe(true);
    }
  });

  it('PRIMITIVE_NAMES is readonly and has expected length', () => {
    expect(PRIMITIVE_NAMES.length).toBe(42);
  });

  it('no extra keys in UI_KIT beyond PRIMITIVE_NAMES', () => {
    const extraKeys = Object.keys(UI_KIT).filter(k => !PRIMITIVE_NAMES.includes(k as any));
    expect(extraKeys).toEqual([]);
  });
});
