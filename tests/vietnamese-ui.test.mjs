import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function load(path, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    localStorage: { getItem: () => "en" },
    require(name) {
      const modules = { react: React, "react/jsx-runtime": jsx, ...imports };
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    },
  });
  return exports;
}
const language = load("src/context/LanguageContext.tsx");
const translations = load("src/lib/ui-translations.ts");
const ui = load("src/components/UiText.tsx", { "@/context/LanguageContext": language, "@/lib/ui-translations": translations });
const defaultExport = component => ({ __esModule: true, default: component });
const common = {
  "@/components/UiText": ui,
  "@/context/LanguageContext": language,
  "next/link": defaultExport(({ children, href, ...props }) => React.createElement("a", { href, ...props }, children)),
  "next/image": defaultExport(({ src, alt }) => React.createElement("img", { src, alt })),
};
function render(children) {
  return renderToStaticMarkup(React.createElement(language.LanguageProvider, null, children));
}

test("first render is Vietnamese even when the old stored preference is English", () => {
  function Probe() {
    const { language: value, locale, t } = language.useLanguage();
    return React.createElement("p", null, `${value}|${locale}|${t("Home", "Trang chủ")}`);
  }
  assert.equal(render(React.createElement(Probe)), "<p>vi|vi-VN|Trang chủ</p>");
});

test("navigation and footer use Vietnamese and expose no language switch", () => {
  const Navbar = load("src/components/Navbar.tsx", {
    ...common,
    "next/navigation": { usePathname: () => "/", useRouter: () => ({ push() {} }) },
    "@/context/AuthContext": { useAuth: () => ({ user: null, loading: false, logout() {} }) },
    "@/context/AdminModerationContext": { useAdminModeration: () => ({ flaggedCount: 0 }), BYPASS_ADMIN_ROLE: false },
  }).default;
  const Footer = load("src/components/Footer.tsx", common).default;
  const html = render(React.createElement(React.Fragment, null, React.createElement(Navbar), React.createElement(Footer)));
  assert.match(html, /Trang chủ/);
  assert.match(html, /Cộng đồng/);
  assert.match(html, /Đăng nhập/);
  assert.doesNotMatch(html, /navbar-languages|Select language|English|Tiếng Việt \(VI\)|>EN<|>VI<|Home|Community/);
});

test("status labels are translated without changing arbitrary author-entered content", () => {
  assert.equal(translations.translateUi("PUBLISHED", "vi"), "Đã xuất bản");
  assert.equal(translations.translateUi("RECIPE", "vi"), "Công thức");
  assert.equal(translations.translateUi("ADMIN", "vi"), "Quản trị viên");
  assert.equal(translations.translateUi("My original recipe title", "vi"), "My original recipe title");
});
