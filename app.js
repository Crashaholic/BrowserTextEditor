const editor = document.getElementById("text-editor");
const filemodal = document.getElementById("fileModal");
const fontsizerect = document.getElementById("measureText").getBoundingClientRect();
const arearect = document.getElementById("measureArea").getBoundingClientRect();
const numcols = Math.floor(arearect.width / fontsizerect.width);
const numrows = Math.floor(arearect.height / fontsizerect.height);
const keyBindings = {};
//edsel.xstart = edsel.ystart = 0;
text = "welcome! drag and drop `binds.js` on the page for custom keybinds.";
isInsertMode = false;

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
        return [this.xend, this.yend]
    }
}

edsel = new EditorSelection(0, 0, 0, 0, false);

// from: https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
    editor.addEventListener(e, preventDefaults, false)
    filemodal.addEventListener(e, preventDefaults, false)
})

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

;['dragenter', 'dragover'].forEach(e => {
    editor.addEventListener(e, modalShow, false);
    filemodal.addEventListener(e, modalShow, false);
});

;['dragleave', 'drop'].forEach(e => {
    editor.addEventListener(e, modalHide, false);
    filemodal.addEventListener(e, modalHide, false);
});

function modalShow() {
    filemodal.classList.add("showModal");
}

function modalHide() {
    filemodal.classList.remove("showModal");
}

editor.addEventListener('drop', dropHandler, false);
filemodal.addEventListener('drop', dropHandler, false);

const cxt = {
    registerKeyBindings, 
    moveCursorUp, 
    moveCursorDown, 
    moveCursorLeft, 
    moveCursorRight,
    moveCursor,
    getInsertMode,
    setInsertMode,
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
    return str.substring(0, index) + chr + str.substring(index + 1 * isInsertMode);
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
    return editor.rows[y].cells[x];
}

function populateTable() {
    editor.innerHTML = '';
    for (let i = 0; i < numrows; i++) {
        row = document.createElement('tr');
        for (let j = 0; j < numcols; j++) {
            cell = document.createElement('td');
            cell.style.height = "" + fontsizerect.height + "px";
            cell.style.fontSize = "" + (fontsizerect.height - 2) + "px";
            row.appendChild(cell);
        }
        editor.appendChild(row);
    }
}

function getInsertMode() {
    return isInsertMode;
}

function setInsertMode(newMode) {
    isInsertMode = newMode;
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
    if (y * numrows + x >= text.length)
        text = text + c;
    else
    text = replaceAt(text, y * numrows + x, c);
}

function writeAtSelection(c) {
    writeAtCell(edsel.xstart, edsel.ystart, c);
}

function renderCell(x, y, c) {
    editor.rows[y].cells[x].innerText = c;
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
    
}

function render() {
    let index = 0;
    for (let row = 0; row < numrows; row++) {
        for (let col = 0; col < numcols; col++) {
            if (index < text.length) {
                renderCell(col, row, text[index]);
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
    if (curr() > text.length) {
        diff = curr() - text.length + 1;
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
    } /*else if (e.key === 'ArrowRight' && edsel.xstart < numcols - 1) {
    moveCursorRight();
    checkFileBounds();
    } else if (e.key === 'ArrowLeft' && edsel.xstart > 0) {
    moveCursorLeft();
    checkFileBounds();
    } else if (e.key === 'ArrowDown' && edsel.ystart < numrows - 1) {
    moveCursorDown();
    checkFileBounds();
    } else if (e.key === 'ArrowUp' && edsel.ystart > 0) {
    moveCursorUp();
    checkFileBounds();
    }*/ else if (e.key.length === 1) {
        writeAtSelection(e.key);
        moveCursorRight();
    } else if (e.key === ' ' && edsel.xstart < numcols - 1) {
        writeAtSelection(' ');
        moveCursorRight();
    } else if (e.key === 'Backspace' && edsel.xstart > 0) {
        moveCursorLeft();
        initialIsInsertMode = getInsertMode();
        setInsertMode(true);
        writeAtSelection('');
        setInsertMode(initialIsInsertMode);
    } else if (e.key === 'Enter') {
    } else if (e.key === 'Insert') {
        isInsertMode = !isInsertMode;
    } else if (e.key === 'Delete') {
        initialIsInsertMode = getInsertMode();
        setInsertMode(true);
        writeAtSelection('');
        setInsertMode(initialIsInsertMode);
    }
    update();
});

function main() {
    update();
}

