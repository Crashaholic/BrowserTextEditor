// this is a test file
// meant for me to try to design up a keybinds type thing
// its no .lua or .vim
// but its honestly the best i got

// so i need something like
// <keybind> command
// something similar to that of vim config file

cxt.registerKeyBindings({
    "h": () => {                       // Move cursor left
        cxt.moveCursorLeft(); 
        cxt.checkFileBounds();
    },
    "j": () => {                       // Move cursor down
        cxt.moveCursorDown();
        cxt.checkFileBounds();
    },
    "k": () => {                       // Move cursor up
        cxt.moveCursorUp();
        cxt.checkFileBounds();
    },
    "l": () => {                       // Move cursor right
        cxt.moveCursorRight();
        cxt.checkFileBounds();
    }
});