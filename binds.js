// this is a test file
// meant for me to try to design up a keybinds type thing
// its no .lua or .vim
// but its honestly the best i got

// so i need something like
// <keybind> command
// something similar to that of vim config file

cxt.registerKeyBindings({
    "h": () => {
        if (cxt.getEditorMode() === EditorMode.NORMAL) {
            cxt.moveCursorLeft(); 
            cxt.checkFileBounds();
        }
    },
    "j": () => {
        if (cxt.getEditorMode() === EditorMode.NORMAL) {
            cxt.moveCursorDown();
            cxt.checkFileBounds();
        }
    },
    "k": () => {
        if (cxt.getEditorMode() === EditorMode.NORMAL) {
            cxt.moveCursorUp();
            cxt.checkFileBounds();
        }
    },
    "l": () => {
        if (cxt.getEditorMode() === EditorMode.NORMAL) {
            cxt.moveCursorRight();
            cxt.checkFileBounds();
        }
    },
});