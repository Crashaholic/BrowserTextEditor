
const editorTable = document.getElementById("text-editor");
const filemodal = document.getElementById("fileModal");
const mtext = document.getElementById("measureText");
const marea = document.getElementById("measureArea");
fontsizerect = mtext.getBoundingClientRect();
arearect = marea.getBoundingClientRect();
numcols = Math.floor(arearect.width / fontsizerect.width);
numrows = Math.floor(arearect.height / fontsizerect.height);
mtext.style.display = "none";
marea.style.display = "none";

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
        this.xstart = newXStart;
        this.ystart = newYStart;
        if (typeof newXEnd !== "undefined" && typeof newYEnd !== "undefined") {
            this.xend = newXStart;
            this.yend = newYStart;
        }
        else {
            this.xend = newXEnd;
            this.yend = newYEnd;    
        }
    }
}

class EditorSelection extends Rect{ // in case of block selection
    constructor(xstart, ystart, xend, yend, block) {
        super(xstart, ystart, xend, yend);
        this.block = block; // TODO
    }
    
    moveStartAndEnd(x, y) {
        this.repos(x, y);
    }
    
    start() {
        return [this.xstart, this.ystart];
    }
    
    end() {
        return [this.xend, this.yend];
    }
}

class Editor {
    buffer = "";
    isInReplaceMode = false; // true when is in insert mode, false when replace mode
    table = null;
    numCols = 0;
    numRows = 0;
    sel = new EditorSelection(0, 0, 0, 0, false);
    keyBindings = {};
    statusBarAddons = {};
    fontSize = 20;
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

const bindsCxt = {
    registerKeyBindings,
    moveCursorUp, 
    moveCursorDown, 
    moveCursorLeft, 
    moveCursorRight,
    moveCursor,
    replaceInString,
    curr,
    pos,
    getInputInsertMode,
    setInputInsertMode,
    writeAtSelection,
    writeToBuffer,
    getBoundsX,
    getBoundsY,
    getEditorSel,
    getCellAt,
    renderCell,
    checkFileBounds,
    getEditorMode,
    setEditorMode,
    checkBounds,
    checkCursorBounds,
    refreshEditor,
};

const statusCxt = {
    registerStatusBarAddon,
    getInputInsertMode,
    curr,
    pos,
    getBoundsX,
    getBoundsY,
    getEditorSel,
    getCellAt,
    renderCell,
    checkFileBounds,
    getEditorMode,
    checkBounds,
    checkCursorBounds,
    refreshEditor,
};

const cxt = {
    loadWebFont,
    setFontSize,
    getFontSize,
};

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
                const statusRegex = /status\.js/g;
                if (file.name.match(bindsRegex)) {
                    reader.onload = (e) => {
                        const scriptContent = e.target.result;
                        try {
                            const scriptFunction = new Function('bindsCxt', scriptContent);
                            scriptFunction(bindsCxt);
                        } catch (err) {
                            console.error("Error loading custom bindings:", err);
                        }
                    };
                } else if (file.name.match(statusRegex)) {
                    reader.onload = (e) => {
                        const scriptContent = e.target.result;
                        try {
                            const scriptFunction = new Function('statusCxt', scriptContent);
                            scriptFunction(statusCxt);
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



function replaceInString(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1 * ed.isInReplaceMode);
}

/*current position*/
function curr(offsetx = 0, offsety = 0) {
    return pos((ed.sel.xstart + offsetx), (ed.sel.ystart + offsety));
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
    return ed.sel;
}

function getCellAt(x, y) {
    return editorTable.rows[y].cells[x];
}

function setFontSize(size) {
    ed.fontSize = size;
}

function getFontSize() {
    return ed.fontSize;
}

function populateTable() {
    editorTable.innerHTML = '';
    let a = getComputedStyle(mtext);
    for (let i = 0; i < numrows; i++) {
        row = document.createElement('tr');
        for (let j = 0; j < numcols; j++) {
            cell = document.createElement('td');
            cell.style.height = "" + fontsizerect.height + "px";
            cell.style.fontSize = a.fontSize;
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
    return checkBounds(0, numcols, 0, numrows, ed.sel.xstart, ed.sel.xend, ed.sel.ystart, ed.sel.yend);
}

function moveCursor(new_x, new_y) {
    getCellAt(ed.sel.xstart, ed.sel.ystart).classList.remove("selected");
    ed.sel.moveStartAndEnd(new_x, new_y);
    if (!checkCursorBounds()) {
        // cursor is out of bounds. panic.
        if (new_x < 0){
            ed.sel.xstart = 0;
            ed.sel.xend = 0;
        }
        if (new_y < 0) {
            if (!ed.sel.block) { // if not block selecting
                ed.sel.ystart = 0;
                ed.sel.yend = 0;
            }
        }
    }
    getCellAt(ed.sel.xstart, ed.sel.ystart).classList.add("selected");
    document.title = "[" + ed.sel.xstart + "," + ed.sel.ystart + "]";
}

function getEditorMode() {
    return edmod;
}

function setEditorMode(newMode) {
    edmod = newMode;
}

function getInputInsertMode() {
    return ed.isInReplaceMode;
}

function setInputInsertMode(newMode) {
    ed.isInReplaceMode = newMode;
}

function moveCursorRel(x, y) {
    moveCursor(ed.sel.xstart + x, ed.sel.ystart + y);
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

function writeToBuffer(x, y, c) {
    if (y * numrows + x >= ed.buffer.length)
        ed.buffer = ed.buffer + c;
    else ed.buffer = replaceInString(ed.buffer, y * numrows + x, c);
}

function writeAtSelection(c) {
    writeToBuffer(ed.sel.xstart, ed.sel.ystart, c);
}

function renderCell(x, y, c) {
    cell = getCellAt(x, y);
    cell.innerText = c;
    return cell;
}

function drawStatusBar() {
    for (const addon in ed.statusBarAddons) {
        ed.statusBarAddons[addon]();
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
    getCellAt(ed.sel.xstart, ed.sel.ystart).classList.add("selected");
}

function refreshEditor() {
    update();
}

function checkFileBounds() {
    if (curr() > ed.buffer.length) {
        diff = curr() - ed.buffer.length + 1;
        if (diff > numcols) {
            if (ed.sel.ystart > 0) {
                moveCursor(numcols - 1, ed.sel.ystart - 1);
            }
        } else {
            if (diff > 0) {
                if (ed.sel.xstart > 0) {
                    moveCursor(ed.sel.xstart - 1, ed.sel.ystart);
                } else {
                    if (ed.sel.ystart > 0) {
                        moveCursor(numcols - 1, ed.sel.ystart - 1);
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

function loadWebFont(fontName, fontUrl) {
    // Create a new @font-face style rule
    const style = document.createElement('style');
    style.innerHTML = `
        @font-face {
            font-family: '${fontName}';
            src: url('${fontUrl}');
        }
    `;
    document.head.appendChild(style);
    
    // Apply the font to your editor or text area
    document.getElementById('editor').style.fontFamily = fontName;
    console.log(`Loaded and applied font: ${fontName}`);
}


// Function to register key bindings
function registerKeyBindings(bindings) {
    for (const key in bindings) {
        if (typeof bindings[key] === 'function') {
            ed.keyBindings[key] = bindings[key];
        } else {
            console.warn(`Binding for ${key} is not a function and will be ignored.`);
        }
    }
}

// Function to register key bindings
function registerStatusBarAddon(bindings) {
    for (const addon in bindings) {
        if (typeof bindings[addon] === 'function') {
            ed.statusBarAddons[addon] = bindings[addon];
        } else {
            console.warn(`Binding for ${addon} is not a function and will be ignored.`);
        }
    }
    update();
}

document.body.addEventListener('keydown', (e) => {
    e.preventDefault();
    const key = e.key;
    const ctrl = e.ctrlKey ? 'C-' : '';
    const alt = e.altKey ? 'A-' : '';
    const shift = e.shiftKey ? 'S-' : '';
    const keyCombo = `<${ctrl}${alt}${shift}${key}>`;
    if (ed.keyBindings[keyCombo]) {
        e.preventDefault();
        ed.keyBindings[keyCombo]();
    } else if (e.key.length === 1) {
        if (edmod === EditorMode.INSERT) {
            writeAtSelection(e.key);
            moveCursorRight();
        }
    }
    update();
});

function main() {
    
    const defaultstatusbarfunction = `
    statusCxt.registerStatusBarAddon({
        "fill" : () => {
            for (let col = 0; col < statusCxt.getBoundsX(); col++) {
                cell = statusCxt.getCellAt(col, statusCxt.getBoundsY() - 2);
                cell.classList.add("fg_black");
                cell.classList.add("bg_white");
            }
        },
        "mode_show" : () => {
            let current_mode = statusCxt.getEditorMode();
            modeMarker = "-- ";
            switch (current_mode)
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
            modeMarker += " --";
        
            for (let x = 0; x < modeMarker.length; x++) {
                statusCxt.renderCell(x + 2, statusCxt.getBoundsY() - 2, modeMarker[x]);
            }   
        },
        "location" : () => {
            start_pos = statusCxt.getEditorSel().start()
            locationMarker = "" + start_pos[0] + "," + start_pos[1];
            for (let x = 0; x < locationMarker.length; x++) {
                statusCxt.renderCell(statusCxt.getBoundsX() - 10 - locationMarker.length + x, statusCxt.getBoundsY() - 2, locationMarker[x]);
            }
        },
        "insert_status" : () => {
            a = statusCxt.getInputInsertMode();
            let str = "";
            if (a) 
                str = "REP";
            else
                str = "INS";
            for (let x = 0; x < str.length; x++) {
                statusCxt.renderCell(statusCxt.getBoundsX() - 15 - locationMarker.length + x, statusCxt.getBoundsY() - 2, str[x]);
            }
        }
    });`;
    
    try {
        const scriptFunction = new Function('statusCxt', defaultstatusbarfunction);
        scriptFunction(statusCxt);
    } catch (err) {
        console.error("Error loading default bindings:", err);
    }
    update();
    
    const defaultKeyBinds = `
    bindsCxt.registerKeyBindings({
        "<ArrowUp>": () => { 
            bindsCxt.moveCursorUp(); 
            bindsCxt.checkFileBounds(); 
        },
        "<ArrowDown>": () => { 
            bindsCxt.moveCursorDown(); 
            bindsCxt.checkFileBounds(); 
        },
        "<ArrowLeft>": () => { 
            bindsCxt.moveCursorLeft(); 
            bindsCxt.checkFileBounds(); 
        },
        "<ArrowRight>": () => { 
            bindsCxt.moveCursorRight(); 
            bindsCxt.checkFileBounds(); 
        },
        "<i>": () => {
            if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
                bindsCxt.setEditorMode(EditorMode.INSERT);
            } else if (bindsCxt.getEditorMode() === EditorMode.INSERT) {
                bindsCxt.writeAtSelection('i');
                bindsCxt.moveCursorRight();
            }
        },
        "<h>": () => {
            if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
                bindsCxt.moveCursorLeft(); 
                bindsCxt.checkFileBounds();
            } else if (bindsCxt.getEditorMode() === EditorMode.INSERT) {
                bindsCxt.writeAtSelection('h');
                bindsCxt.moveCursorRight();
            }
        },
        "<j>": () => {
            if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
                bindsCxt.moveCursorDown();
                bindsCxt.checkFileBounds();
            } else if (bindsCxt.getEditorMode() === EditorMode.INSERT) {
                bindsCxt.writeAtSelection('j');
                bindsCxt.moveCursorRight();
            }
        },
        "<k>": () => {
            if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
                bindsCxt.moveCursorUp();
                bindsCxt.checkFileBounds();
            } else if (bindsCxt.getEditorMode() === EditorMode.INSERT) {
                bindsCxt.writeAtSelection('k');
                bindsCxt.moveCursorRight();
            }
        },
        "<l>": () => {
            if (bindsCxt.getEditorMode() === EditorMode.NORMAL) {
                bindsCxt.moveCursorRight();
                bindsCxt.checkFileBounds();
            } else if (bindsCxt.getEditorMode() === EditorMode.INSERT) {
                bindsCxt.writeAtSelection('l');
                bindsCxt.moveCursorRight();
            }
        },
        "<Backspace>": () => {
            sel = bindsCxt.getEditorSel();
            if (sel.start()[0] > 0) {
                bindsCxt.moveCursorLeft();
                initialIsInsertMode = bindsCxt.getInputInsertMode();
                bindsCxt.setInputInsertMode(true);
                bindsCxt.writeAtSelection('');
                bindsCxt.setInputInsertMode(initialIsInsertMode);
            }
        },
        "<Delete>": () => {
            initialIsInsertMode = bindsCxt.getInputInsertMode();
            bindsCxt.setInputInsertMode(true);
            bindsCxt.writeAtSelection('');
            bindsCxt.setInputInsertMode(initialIsInsertMode);
        },
        "<Escape>": () => {
            bindsCxt.setEditorMode(EditorMode.NORMAL);
        },
        "<Insert>": () => {
            bindsCxt.setInputInsertMode(!bindsCxt.getInputInsertMode());
        }
    });`;

    try {
        const scriptFunction = new Function('bindsCxt', defaultKeyBinds);
        scriptFunction(bindsCxt);
    } catch (err) {
        console.error("Error loading default bindings:", err);
    }
}

