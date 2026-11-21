/**
 * Pulsa listbox: replaces the look of a native <select> in the dashboard.
 *
 * The browser draws an open <select> itself (grey box, system-blue highlight), so it never matched the
 * app. `enhanceSelect` keeps the real <select> in the page as the value holder (forms, React `onChange`
 * and `getElementById(id).value` keep working) and puts a button and a listbox in front of it,
 * following the ARIA "select-only combobox" pattern: focus stays on the button, the highlighted option
 * is announced through `aria-activedescendant`.
 *
 * Keys: Down/Up/Enter/Space open; Down/Up/Home/End/PageUp/PageDown move; typing jumps to a label;
 * Enter/Space choose; Escape and Tab close. A click outside closes. Nothing here uses alert/confirm,
 * so it also works in a sandboxed iframe without allow-modals.
 */

let serial = 0;

export function enhanceSelect(select: HTMLSelectElement): () => void {
  if (select.dataset.listbox) return () => {};
  const uid = `lb-${++serial}`;
  select.dataset.listbox = uid;

  const button = document.createElement("button");
  button.type = "button";
  button.id = `${uid}-button`;
  // same classes and inline styles as the select, so it sits in the layout exactly like the field it replaces
  button.className = `${select.className} listbox-button`.trim();
  button.style.cssText = select.style.cssText;
  button.setAttribute("role", "combobox");
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", `${uid}-list`);
  button.disabled = select.disabled;
  const label = select.getAttribute("aria-label");
  if (label) button.setAttribute("aria-label", label);
  const labelIds = Array.from(select.labels ?? [])
    .filter((l) => !l.contains(select)) // a wrapping <label> names the button by itself
    .map((l, i) => (l.id ||= `${uid}-label-${i}`));
  if (labelIds.length) button.setAttribute("aria-labelledby", labelIds.join(" "));

  // every label is laid out in the same grid cell, so the button is as wide as its longest option
  // and never cuts the current one short
  const value = document.createElement("span");
  value.className = "listbox-value";
  button.append(value);

  const list = document.createElement("ul");
  list.id = `${uid}-list`;
  list.className = "listbox";
  list.setAttribute("role", "listbox");
  list.tabIndex = -1;
  list.hidden = true;
  if (label) list.setAttribute("aria-label", label);
  else if (labelIds.length) list.setAttribute("aria-labelledby", labelIds.join(" "));

  const text = (o: HTMLOptionElement) => (o.label || o.text).trim();
  const options = () => Array.from(select.options);
  let items: HTMLLIElement[] = [];
  let active = -1;
  let open = false;

  const renderValue = () => {
    value.replaceChildren(
      ...options().map((o, i) => {
        const s = document.createElement("span");
        s.textContent = text(o);
        if (i !== select.selectedIndex) s.setAttribute("aria-hidden", "true");
        else s.dataset.current = "";
        return s;
      }),
    );
  };

  const renderList = () => {
    items = options().map((o, i) => {
      const li = document.createElement("li");
      li.id = `${uid}-option-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === select.selectedIndex));
      if (o.disabled) li.setAttribute("aria-disabled", "true");
      li.textContent = text(o);
      return li;
    });
    list.replaceChildren(...items);
  };

  const setActive = (i: number) => {
    if (i < 0 || i >= items.length) return;
    items[active]?.removeAttribute("data-active");
    active = i;
    items[i].setAttribute("data-active", "");
    button.setAttribute("aria-activedescendant", items[i].id);
    items[i].scrollIntoView({ block: "nearest" });
  };

  /** next enabled option from `from` in direction `step` (stays put at the ends) */
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < items.length; i += dir) if (!select.options[i].disabled) return i;
    return from;
  };
  const edge = (dir: 1 | -1) => step(dir === 1 ? -1 : items.length, dir);

  const place = () => {
    const r = button.getBoundingClientRect();
    const gap = 6;
    const below = window.innerHeight - r.bottom - gap - 8;
    const above = r.top - gap - 8;
    const want = Math.min(list.scrollHeight + 2, 320);
    const up = below < Math.min(want, 180) && above > below;
    list.style.maxHeight = `${Math.max(120, Math.min(want, up ? above : below))}px`;
    list.style.minWidth = `${r.width}px`;
    const width = Math.max(list.offsetWidth, r.width);
    list.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - width - 8))}px`;
    if (up) {
      list.style.top = "";
      list.style.bottom = `${window.innerHeight - r.top + gap}px`;
    } else {
      list.style.bottom = "";
      list.style.top = `${r.bottom + gap}px`;
    }
  };

  const onOutside = (e: Event) => {
    const t = e.target as Node;
    if (!button.contains(t) && !list.contains(t)) close();
  };

  const show = (start?: number) => {
    if (open || button.disabled) return;
    open = true;
    renderList();
    // inside a SweetAlert2 dialog the list joins the dialog's own layer; elsewhere it goes to <body>
    (button.closest(".swal2-container") ?? document.body).append(list);
    list.hidden = false;
    button.setAttribute("aria-expanded", "true");
    place();
    setActive(start ?? (select.selectedIndex >= 0 ? select.selectedIndex : edge(1)));
    document.addEventListener("pointerdown", onOutside, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
  };

  function close() {
    if (!open) return;
    open = false;
    list.hidden = true;
    list.remove();
    active = -1;
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("aria-activedescendant");
    document.removeEventListener("pointerdown", onOutside, true);
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, true);
  }

  const choose = (i: number) => {
    const o = select.options[i];
    if (!o || o.disabled) return;
    const changed = select.selectedIndex !== i;
    select.selectedIndex = i;
    renderValue();
    close();
    // React and plain listeners hear the same events a native pick would send
    if (changed) {
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  let typed = "";
  let typedAt = 0;
  const typeAhead = (ch: string) => {
    const now = Date.now();
    typed = now - typedAt > 600 ? ch : typed + ch;
    typedAt = now;
    const labels = options().map((o) => text(o).toLowerCase());
    const from = Math.max(active, 0);
    const same = typed.split("").every((c) => c === typed[0]);
    const find = (q: string, start: number) => {
      for (let n = 0; n < labels.length; n++) {
        const i = (start + n) % labels.length;
        if (labels[i].startsWith(q) && !select.options[i].disabled) return i;
      }
      return -1;
    };
    // the same letter again steps through the options that start with it
    const hit = same ? find(typed[0], typed.length > 1 ? from + 1 : from) : find(typed, from);
    if (hit >= 0) setActive(hit);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    const handled = () => {
      e.preventDefault();
      e.stopPropagation(); // an open list owns Escape/Enter, not the dialog around it
    };
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        handled();
        show();
      } else if (k === "Home" || k === "End") {
        handled();
        show(edge(k === "Home" ? 1 : -1));
      } else if (k.length === 1) {
        handled();
        show();
        typeAhead(k.toLowerCase());
      }
      return;
    }
    if (k === "Escape") {
      handled();
      close();
    } else if (k === "Tab") {
      close();
    } else if (k === "Enter" || (k === " " && Date.now() - typedAt > 600)) {
      handled();
      choose(active);
    } else if (k === "ArrowDown" || k === "ArrowUp") {
      handled();
      setActive(step(active, k === "ArrowDown" ? 1 : -1));
    } else if (k === "Home" || k === "End") {
      handled();
      setActive(edge(k === "Home" ? 1 : -1));
    } else if (k === "PageDown" || k === "PageUp") {
      handled();
      let i = active;
      for (let n = 0; n < 5; n++) i = step(i, k === "PageDown" ? 1 : -1);
      setActive(i);
    } else if (k.length === 1) {
      handled();
      typeAhead(k.toLowerCase());
    }
  };

  // Only a press on the button itself toggles the list. A click forwarded from a <label> just focuses
  // the field, as it does for a native select; Enter and Space are handled in onKey.
  let pressed = false;
  const onDown = () => {
    pressed = true;
  };
  const onClick = () => {
    if (!pressed) return button.focus();
    pressed = false;
    if (open) close();
    else show();
  };
  const onListDown = (e: Event) => e.preventDefault(); // keep focus on the button
  const onListClick = (e: Event) => {
    const li = (e.target as HTMLElement).closest("li");
    if (li) choose(items.indexOf(li as HTMLLIElement));
  };
  const onListMove = (e: Event) => {
    const li = (e.target as HTMLElement).closest("li");
    const i = li ? items.indexOf(li as HTMLLIElement) : -1;
    if (i >= 0 && i !== active && !select.options[i].disabled) setActive(i);
  };
  const onBlur = () => close();
  const onNativeChange = () => renderValue();

  button.addEventListener("keydown", onKey);
  button.addEventListener("pointerdown", onDown);
  button.addEventListener("click", onClick);
  button.addEventListener("blur", onBlur);
  list.addEventListener("pointerdown", onListDown);
  list.addEventListener("click", onListClick);
  list.addEventListener("pointermove", onListMove);
  select.addEventListener("change", onNativeChange);

  // options or the value set from outside (React re-render, form reset)
  const watch = new MutationObserver(() => {
    button.disabled = select.disabled;
    renderValue();
  });
  watch.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "selected", "label"] });

  renderValue();
  select.before(button);
  select.hidden = true;
  select.tabIndex = -1;

  return () => {
    close();
    watch.disconnect();
    select.removeEventListener("change", onNativeChange);
    button.remove();
    select.hidden = false;
    select.removeAttribute("tabindex");
    delete select.dataset.listbox;
  };
}

/** Enhance every <select> inside `root` (used for the SweetAlert2 forms, which are built from HTML strings). */
export function enhanceSelects(root: ParentNode | null | undefined) {
  root?.querySelectorAll("select").forEach((s) => enhanceSelect(s));
}
