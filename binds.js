// this is a test file
// meant for me to try to design up a keybinds type thing
// its no .lua or .vim
// but its honestly the best i got

// so i need something like
// <keybind> command
// something similar to that of vim config file

bindsCxt.registerKeyBindings({
    "h": () => {
        if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
            bindsCxt.moveCursorLeft(); 
            bindsCxt.checkFileBounds();
        }
    },
    "j": () => {
        if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
            bindsCxt.moveCursorDown();
            bindsCxt.checkFileBounds();
        }
    },
    "k": () => {
        if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
            bindsCxt.moveCursorUp();
            bindsCxt.checkFileBounds();
        }
    },
    "l": () => {
        if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
            bindsCxt.moveCursorRight();
            bindsCxt.checkFileBounds();
        }
    },
});
