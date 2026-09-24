/** Drop CSS that some WebKit builds treat as a parse error and discard the whole file. */
function replaceRelativeColor(value, name, fallback) {
  const needle = `${name}(from`;
  let out = value;
  let idx = out.indexOf(needle);
  while (idx !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = idx + name.length; i < out.length; i++) {
      if (out[i] === "(") depth++;
      else if (out[i] === ")") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    out = out.slice(0, idx) + fallback + out.slice(end + 1);
    idx = out.indexOf(needle);
  }
  return out;
}

const safariSafeCss = () => ({
  postcssPlugin: "safari-safe-css",
  Once(root) {
    root.walkAtRules("supports", (rule) => {
      if (rule.params.includes("from ")) {
        rule.replaceWith(rule.nodes);
      }
    });
    root.walkDecls((decl) => {
      if (!decl.value.includes("from ")) return;
      decl.value = replaceRelativeColor(decl.value, "oklch", "rgba(255,255,255,0.22)");
      decl.value = replaceRelativeColor(decl.value, "rgb", "rgb(255,0,0)");
    });
  },
});

safariSafeCss.postcss = true;

export default safariSafeCss;
