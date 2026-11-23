import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";

export const defaultExport = component => ({ __esModule: true, default: component });

// Keep unknown dependencies visible: an unsupported import must fail the test.
export function loadModule(path, dependencies = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, Error, URLSearchParams, AbortController, setTimeout, clearTimeout,
    require(name) {
      const modules = { react: React, "react/jsx-runtime": jsx, ...dependencies };
      assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`);
      return modules[name];
    }, ...globals,
  });
  return exports;
}

export function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  return [value, ...nodes(value.props?.children)];
}
export function text(value) {
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?.props ? value.props.text ?? text(value.props.children) : "";
}
export function button(tree, label) {
  const normalize = value => value.replace(/\s+/g, " ").replace(/\(\s*/g, "(").replace(/\s*\)/g, ")").trim();
  const match = nodes(tree).find(node => node.type === "button" && normalize(text(node)) === normalize(label));
  assert.ok(match, `Missing button: ${label}`);
  return match;
}

// Only the parent component uses this runtime; child components keep React's SSR runtime.
export function hookHarness() {
  const states = [], effects = [];
  let cursor = 0, effectIndex = 0;
  return {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
      useMemo: callback => callback(),
      useEffect(callback, deps) {
        const index = effectIndex++, previous = effects[index];
        if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
          effects[index] = { callback, deps, cleanup: previous?.cleanup, pending: true };
        }
      },
    },
    render(Component) { cursor = 0; effectIndex = 0; return Component(); },
    async flushEffects() {
      for (const effect of effects) if (effect.pending) {
        effect.cleanup?.(); effect.cleanup = effect.callback(); effect.pending = false;
      }
      await new Promise(setImmediate);
    },
    cleanup() { effects.forEach(effect => effect.cleanup?.()); },
  };
}
