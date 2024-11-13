const editorTable = document.getElementById("text-editor");
const filemodal = document.getElementById("fileModal");
const fontsizerect = document.getElementById("measureText").getBoundingClientRect();
const arearect = document.getElementById("measureArea").getBoundingClientRect();
const numcols = Math.floor(arearect.width / fontsizerect.width);
const numrows = Math.floor(arearect.height / fontsizerect.height);
const keyBindings = {};

// https://stackoverflow.com/a/64420699
class EditorMode {
    // Private Fields
    static #_NORMAL = 0;
    static #_COMMAND = 10;
    static #_INSERT = 20;
    static #_VISUAL = 30;
    static #_VISUALLINE = 31;
    static #_VISUALBLOCK = 32;
    static #_REPLACE = 40;

    // Accessors for "get" functions only (no "set" functions)
    static get NORMAL() { return this.#_NORMAL; }
    static get COMMAND() { return this.#_COMMAND; }
    static get INSERT() { return this.#_INSERT; }
    static get VISUAL() { return this.#_VISUAL; }
    static get VISUALLINE() { return this.#_VISUALLINE; }
    static get VISUALBLOCK() { return this.#_VISUALBLOCK; }
    static get REPLACE() { return this.#_REPLACE; }
}

edmod = EditorMode.NORMAL;

class Rect {
    constructor(xstart = 0, ystart = 0, xend = 0, yend = 0) {
        this.xstart = xstart;
        this.ystart = ystart;
        this.xend = xend;
        this.yend = yend;
    }
    
    // as in: reposition
    repos(newXStart, newYStart, newXEnd, newYEnd) {
        
    }
    
    repos() {
        
    }
}

class EditorSelection extends Rect{ // in case of block selection
    constructor(xstart, ystart, xend, yend, block) {
        super(xstart, ystart, xend, yend);
        this.block = block; // TODO
    }
    
    moveStartAndEnd(x, y) {
        this.xstart = this.xend = x;
        this.ystart = this.yend = y;
    }
    
    start() {
        return [this.xstart, this.ystart];
    }
    
    end() {
        return [this.xend, this.yend];
    }
}

edsel = new EditorSelection(0, 0, 0, 0, false);

class Editor {
    buffer = "";
    inputInsertMode = false;
    table = null;
    numCols = 0;
    numRows = 0;
    sel = new EditorSelection(0, 0, 0, 0, false);
    constructor() {
        this.buffer = "welcome! drag and drop `binds.js` on the page for custom keybinds.";
    }
}

ed = new Editor();

// from: https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
    editorTable.addEventListener(e, preventDefaults, false)
    filemodal.addEventListener(e, preventDefaults, false)
})

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

;['dragenter', 'dragover'].forEach(e => {
    editorTable.addEventListener(e, modalShow, false);
    filemodal.addEventListener(e, modalShow, false);
});

;['dragleave', 'drop'].forEach(e => {
    editorTable.addEventListener(e, modalHide, false);
    filemodal.addEventListener(e, modalHide, false);
});

function modalShow() {
    filemodal.classList.add("showModal");
}

function modalHide() {
    filemodal.classList.remove("showModal");
}

editorTable.addEventListener('drop', dropHandler, false);
filemodal.addEventListener('drop', dropHandler, false);

const cxt = {
    registerKeyBindings, 
    moveCursorUp, 
    moveCursorDown, 
    moveCursorLeft, 
    moveCursorRight,
    moveCursor,
    getInputInsertMode,
    setInputInsertMode,
    replaceAt,
    curr,
    pos,
    writeAtSelection,
    writeAtCell,
    getBoundsX,
    getBoundsY,
    getEditorSel,
    getCellAt,
    checkFileBounds,
    getEditorMode,
    setEditorMode,
    getEditorSel,
    checkBounds,
    checkCursorBounds,

}

function dropHandler(e) {
    if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...e.dataTransfer.items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                let file = item.getAsFile();
                console.log(`...file[${i}].name = ${file.name}`);
                let reader = new FileReader();
                const bindsRegex = /binds\.js/g;
                if (file.name.match(bindsRegex)){
                    reader.onload = (e) => {
                        const scriptContent = e.target.result;
                        try {
                            const scriptFunction = new Function('cxt', scriptContent);
                            scriptFunction(cxt);
                        } catch (err) {
                            console.error("Error loading custom bindings:", err);
                        }
                    };
                }
                reader.readAsText(file);
            }
        });
    }
}

function replaceAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1 * ed.inputInsertMode);
}

/*current position*/
function curr(offsetx = 0, offsety = 0) {
    return pos((edsel.xstart + offsetx), (edsel.ystart + offsety));
}

function pos(x = 0, y = 0){
    return y * numcols + x;
}

function getBoundsX() {
    return numcols;
}

function getBoundsY() {
    return numrows;
}

function getEditorSel() {
    return edsel;
}

function getCellAt(x, y) {
    return editorTable.rows[y].cells[x];
}

function populateTable() {
    editorTable.innerHTML = '';
    for (let i = 0; i < numrows; i++) {
        row = document.createElement('tr');
        for (let j = 0; j < numcols; j++) {
            cell = document.createElement('td');
            cell.style.height = "" + fontsizerect.height + "px";
            cell.style.fontSize = "" + (fontsizerect.height - 2) + "px";
            row.appendChild(cell);
        }
        editorTable.appendChild(row);
    }
}

//sx, sy = source, the bigger box bound
//dx, dy = destin, the smaller box bound
function checkBounds(sxmin, sxmax, symin, symax, dxmin, dxmax, dymin, dymax) {
    return (dxmin >= sxmin && dxmax <= sxmax && symin >= dymin && symax <= dymax);
}

function checkCursorBounds() {
    return checkBounds(0, numcols, 0, numrows, edsel.xstart, edsel.xend, edsel.ystart, edsel.yend);
}

function moveCursor(new_x, new_y) {
    getCellAt(edsel.xstart, edsel.ystart).classList.remove("selected");
    edsel.moveStartAndEnd(new_x, new_y);
    if (!checkCursorBounds()) {
        // cursor is out of bounds. panic.
        if (new_x < 0){
            edsel.xstart = 0;
            edsel.xend = 0;
        }
        if (new_y < 0) {
            if (!edsel.block) { // if not block selecting
                edsel.ystart = 0;
                edsel.yend = 0;
            }
        }
    }
    getCellAt(edsel.xstart, edsel.ystart).classList.add("selected");
    document.title = "[" + edsel.xstart + "," + edsel.ystart + "]";
}

function getEditorMode() {
    return edmod;
}

function setEditorMode(newMode) {
    edmod = newMode;
}

function getInputInsertMode() {
    return ed.inputInsertMode;
}

function setInputInsertMode(newMode) {
    ed.inputInsertMode = newMode;
}

function moveCursorRel(x, y) {
    moveCursor(edsel.xstart + x, edsel.ystart + y);
}

function moveCursorRight() {
    moveCursorRel(1, 0);
}

function moveCursorLeft() {
    moveCursorRel(-1, 0);
}

function moveCursorUp() {
    moveCursorRel(0, -1);
}

function moveCursorDown() {
    moveCursorRel(0, 1);
}

function writeAtCell(x, y, c) {
    if (y * numrows + x >= ed.buffer.length)
        ed.buffer = ed.buffer + c;
    else
    ed.buffer = replaceAt(ed.buffer, y * numrows + x, c);
}

function writeAtSelection(c) {
    writeAtCell(edsel.xstart, edsel.ystart, c);
}

function renderCell(x, y, c) {
    editorTable.rows[y].cells[x].innerText = c;
}

function drawStatusBar() {
    for (let col = 0; col < numcols; col++) {
        cell = getCellAt(col, numrows - 2);
        cell.classList.add("fg_black");
        cell.classList.add("bg_white");
    }
    
    positionMarker = "" + edsel.xstart + "," + edsel.ystart;
    
    for (let x = 0; x < positionMarker.length; x++) {
        cell = getCellAt(numcols - 10 - positionMarker.length + x, numrows - 2);
        cell.innerText = positionMarker[x];
    }

    modeMarker = "- ";
    switch (edmod)
    {
        case EditorMode.NORMAL: {
            modeMarker += "NORMAL";
            break;
        }
        case EditorMode.INSERT: {
            modeMarker += "INSERT";
            break;
        }
        case EditorMode.VISUAL: {
            modeMarker += "VISUAL";
            break;
        }
        case EditorMode.VISUALLINE: {
            modeMarker += "VISUAL LINE";
            break;
        }
        case EditorMode.VISUALBLOCK: {
            modeMarker += "VISUAL BLOCK";
            break;
        }
        default:
            break;
    };
    modeMarker += " -";
    
    for (let x = 0; x < modeMarker.length; x++) {
        cell = getCellAt(x + 2, numrows - 2);
        cell.innerText = modeMarker[x];
    }   
}

function render() {
    let index = 0;
    for (let row = 0; row < numrows; row++) {
        for (let col = 0; col < numcols; col++) {
            if (index < ed.buffer.length) {
                renderCell(col, row, ed.buffer[index]);
                index++;
            } else {
                renderCell(col, row, '');
            }
        }
    }
    drawStatusBar();
}

function update() {
    populateTable();
    render();
    getCellAt(edsel.xstart, edsel.ystart).classList.add("selected");
}

function checkFileBounds() {
    if (curr() > ed.buffer.length) {
        diff = curr() - ed.buffer.length + 1;
        if (diff > numcols) {
            if (edsel.ystart > 0) {
                moveCursor(numcols - 1, edsel.ystart - 1);
            }
        } else {
            if (diff > 0) {
                if (edsel.xstart > 0) {
                    moveCursor(edsel.xstart - 1, edsel.ystart);
                } else {
                    if (edsel.ystart > 0) {
                        moveCursor(numcols - 1, edsel.ystart - 1);
                    }
                }
            } else {
                moveCursor(0, 0); // Reached the start of the file (0,0) - stop further recursion
                return;
            }
        }
        // Recurse only if further adjustments are still needed
        checkFileBounds();
    }
}


// Function to register key bindings
function registerKeyBindings(bindings) {
    for (const key in bindings) {
        if (typeof bindings[key] === 'function') {
            keyBindings[key] = bindings[key];
        } else {
            console.warn(`Binding for ${key} is not a function and will be ignored.`);
        }
    }
}

document.body.addEventListener('keydown', (e) => {
    e.preventDefault();
    const key = e.key;
    const ctrl = e.ctrlKey ? 'Ctrl+' : '';
    const alt = e.altKey ? 'Alt+' : '';
    const shift = e.shiftKey ? 'Shift+' : '';
    const keyCombo = `${ctrl}${alt}${shift}${key}`;
    if (keyBindings[keyCombo]) {
        e.preventDefault();
        keyBindings[keyCombo]();
    } else if (e.key.length === 1) {
        if (edmod === EditorMode.INSERT) {
            writeAtSelection(e.key);
            moveCursorRight();
        }
    } else if (e.key === 'Delete') {
        initialIsInsertMode = getInputInsertMode();
        setInputInsertMode(true);
        writeAtSelection('');
        setInputInsertMode(initialIsInsertMode);
    }
    update();
});

function main() {
    update();

    const defaultKeyBinds = '\
    cxt.registerKeyBindings({\
        "ArrowUp": () => { \
            cxt.moveCursorUp(); \
            cxt.checkFileBounds(); \
        },\
        "ArrowDown": () => { \
            cxt.moveCursorDown(); \
            cxt.checkFileBounds(); \
        },\
        "ArrowLeft": () => { \
            cxt.moveCursorLeft(); \
            cxt.checkFileBounds(); \
        },\
        "ArrowRight": () => { \
            cxt.moveCursorRight(); \
            cxt.checkFileBounds(); \
        },\
        "i": () => {\
            if (cxt.getEditorMode() === EditorMode.NORMAL) {\
                cxt.setEditorMode(EditorMode.INSERT);\
            } else if (cxt.getEditorMode() === EditorMode.INSERT) {\
                cxt.writeAtSelection(\'i\');\
                cxt.moveCursorRight();\
            }\
        },\
        "h": () => {\
            if (cxt.getEditorMode() === EditorMode.NORMAL) {\
                cxt.moveCursorLeft(); \
                cxt.checkFileBounds();\
            } else if (cxt.getEditorMode() === EditorMode.INSERT) {\
                cxt.writeAtSelection(\'h\');\
                cxt.moveCursorRight();\
            }\
        },\
        "j": () => {\
            if (cxt.getEditorMode() === EditorMode.NORMAL) {\
                cxt.moveCursorDown();\
                cxt.checkFileBounds();\
            } else if (cxt.getEditorMode() === EditorMode.INSERT) {\
                cxt.writeAtSelection(\'j\');\
                cxt.moveCursorRight();\
            }\
        },\
        "k": () => {\
            if (cxt.getEditorMode() === EditorMode.NORMAL) {\
                cxt.moveCursorUp();\
                cxt.checkFileBounds();\
            } else if (cxt.getEditorMode() === EditorMode.INSERT) {\
                cxt.writeAtSelection(\'k\');\
                cxt.moveCursorRight();\
            }\
        },\
        "l": () => {\
            if (cxt.getEditorMode() === EditorMode.NORMAL) {\
                cxt.moveCursorRight();\
                cxt.checkFileBounds();\
            } else if (cxt.getEditorMode() === EditorMode.INSERT) {\
                cxt.writeAtSelection(\'l\');\
                cxt.moveCursorRight();\
            }\
        },\
        "Backspace": () => {\
            cxt.moveCursorLeft();\
            initialIsInsertMode = cxt.getInputInsertMode();\
            cxt.setInputInsertMode(true);\
            cxt.writeAtSelection(\'\');\
            cxt.setInputInsertMode(initialIsInsertMode);\
        },\
        "Delete": () => {\
            initialIsInsertMode = cxt.getInputInsertMode();\
            cxt.setInputInsertMode(true);\
            cxt.writeAtSelection(\'\');\
            cxt.setInputInsertMode(initialIsInsertMode);\
        },\
        "Escape": () => {\
            cxt.setEditorMode(EditorMode.NORMAL);\
        },\
        "Insert": () => {\
            cxt.setInputInsertMode(!cxt.getInputInsertMode());\
        }\
    });';
    try {
        const scriptFunction = new Function('cxt', defaultKeyBinds);
        scriptFunction(cxt);
    } catch (err) {
        console.error("Error loading default bindings:", err);
    }
}

