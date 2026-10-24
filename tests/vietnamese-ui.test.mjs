import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Vietnamese is the only selectable UI language", () => {
  const context = source("src/context/LanguageContext.tsx");
  const navbar = source("src/components/Navbar.tsx");
  const footer = source("src/components/Footer.tsx");
  const layout = source("src/app/layout.tsx");

  assert.match(context, /language: "vi"/);
  assert.match(context, /locale: "vi-VN"/);
  assert.match(layout, /lang="vi"/);
  assert.doesNotMatch(context, /setLanguage|veggiemate-language/);
  assert.doesNotMatch(navbar, /setLanguage|navbar-languages|showLanguageDropdown/);
  assert.doesNotMatch(footer, /setLanguage|English \(EN\)/);
});
