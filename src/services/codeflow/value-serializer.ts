/**
 * CODEFLOW — Value Serializer
 * Converts JavaScript runtime values to serializable RuntimeValue objects
 * and generates human-readable display strings.
 */

import { RuntimeValue, RuntimeObject, RuntimeArray, RuntimeFunction } from './types';

const MAX_DEPTH = 3;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 20;

/**
 * Convert any JS value to a serializable RuntimeValue.
 */
export function serialize(value: unknown, depth = 0): RuntimeValue {
  if (depth > MAX_DEPTH) return '[...]';

  if (value === null) return null;
  if (value === undefined) return undefined;

  const t = typeof value;

  if (t === 'number' || t === 'boolean' || t === 'string') {
    return value as RuntimeValue;
  }

  if (typeof value === 'function') {
    const fn = value as Function;
    return {
      __type: 'function',
      name: fn.name || '(anonymous)',
      params: extractParams(fn),
    } as RuntimeFunction;
  }

  if (Array.isArray(value)) {
    return {
      __type: 'array',
      elements: value
        .slice(0, MAX_ARRAY_ITEMS)
        .map((el) => serialize(el, depth + 1)),
    } as RuntimeArray;
  }

  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).slice(0, MAX_OBJECT_KEYS);
    const properties: Record<string, RuntimeValue> = {};
    for (const key of keys) {
      properties[key] = serialize(obj[key], depth + 1);
    }
    return { __type: 'object', properties } as RuntimeObject;
  }

  return String(value);
}

/**
 * Convert a RuntimeValue to a human-readable display string.
 */
export function display(value: RuntimeValue, depth = 0): string {
  if (depth > 2) return '...';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);

  const v = value as RuntimeObject | RuntimeArray | RuntimeFunction;

  if (v.__type === 'function') {
    return `ƒ ${(v as RuntimeFunction).name}()`;
  }

  if (v.__type === 'array') {
    const arr = v as RuntimeArray;
    const items = arr.elements
      .slice(0, 5)
      .map((el) => display(el, depth + 1));
    const suffix = arr.elements.length > 5 ? `, ...+${arr.elements.length - 5}` : '';
    return `[${items.join(', ')}${suffix}]`;
  }

  if (v.__type === 'object') {
    const obj = v as RuntimeObject;
    const keys = Object.keys(obj.properties).slice(0, 3);
    const pairs = keys.map((k) => `${k}: ${display(obj.properties[k], depth + 1)}`);
    const suffix = Object.keys(obj.properties).length > 3 ? ', ...' : '';
    return `{${pairs.join(', ')}${suffix}}`;
  }

  return String(value);
}

function extractParams(fn: Function): string[] {
  try {
    const src = fn.toString();
    const match = src.match(/^(?:function\s*\w*\s*)?\(([^)]*)\)/);
    if (match && match[1]) {
      return match[1]
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}
