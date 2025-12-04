# Open Issues

## Issue 1: Multiple selection highlighting

On the launcher both the "arrow navigation" and "mouse hover" cause hover or selected state to be applied to multiple items. This creates confusion about which item will be pasted when Enter is pressed. We should remove the hover state and only allow arrow navigation to select an item. We should also add a "click to select" behavior to the items.

## Issue 2: Select-All does not work in editor

When trying to select all content in the editor, the "Select All" option is not working. This is likely because the editor is using a different DOM structure than the markdown editor. We should investigate how to make the "Select All" behavior work in the editor.

## Feature 1: Editor window pinning

### **Goal**

Allow the existing Editor window to switch between **Normal Mode** (current behavior) and a new **Pinned Mode** that keeps the Editor visible and on top, with different dismissal behavior.

---

## **Feature Summary**

Add a *Pin Mode* toggle to the Editor window.
When active, the Editor becomes an **always-on-top floating window** with simplified dismissal (Escape or Close button).
When inactive, the Editor behaves exactly as it does today.

---

## **Modes**

### **1. Normal Mode (default, existing behavior)**

* Behaves like a standard window.
* Can be moved, minimized, hidden, backgrounded.
* Clicking outside the window does *not* auto-dismiss it.
* Only closes when the user explicitly clicks the close button or uses standard OS-level shortcuts (Cmd+W, etc.).
* No change is required from the current implementation.

---

### **2. Pinned Mode (new behavior)**

When Pin Mode is turned on:

**Window behavior**

* The Editor becomes an **always-on-top** floating window.
* Stays above all other windows in the app (and optionally other apps depending on platform constraints).

**Dismissal behavior**

* Does **not** close when clicking outside of it.
* Closes only when:

  * The user hits `Escape`, or
  * The user presses the window’s close button.

**Other behaviors**

* Maintains full edit functionality.
* Can still be moved around the screen.
* Does *not* minimize automatically.
* Returns to Normal Mode when the user toggles pin off.

---

## **Pin Toggle UX**

### **Control**

* Add a “pin” icon button to the Editor window’s title bar / toolbar.
* **States:**

  * Unpinned: outlined pin
  * Pinned: filled or highlighted pin

### **Interaction**

* Clicking the pin toggles between:

  * **Normal Mode → Pinned Mode**

    * Apply always-on-top
    * Enable Escape-to-close
  * **Pinned Mode → Normal Mode**

    * Remove always-on-top
    * Restore standard window behavior

---

## **Keyboard Behavior**

### In Normal Mode:

* `Esc` → *No special behavior* (whatever the app currently does)

### In Pinned Mode:

* `Esc` → **Close the Editor window**

---

## **Acceptance Criteria**

* When unpinned, Editor behavior is completely unchanged.
* When pinned:

  * Window floats on top.
  * `Esc` closes it.
  * Clicking outside does **not** dismiss it.
* Toggling the pin updates the window’s mode immediately.
* The feature introduces no behavioral changes to the Launcher/Spotlight system.

---

## **Notes / Intent**

The goal is to support two usage styles:

1. **Full editing sessions** → Normal Mode (unchanged)
2. **Quick utility-style edits** → Pinned Mode (always-on-top + fast dismissal via Escape)

This feature simply adds a selectable “personality” for the same window, not a new window type or workflow.
