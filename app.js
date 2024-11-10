const editor = document.getElementById("text-editor");
const filemodal = document.getElementById("fileModal");
const fontsizerect = document.getElementById("measureText").getBoundingClientRect();
const arearect = document.getElementById("measureArea").getBoundingClientRect();
const numcols = Math.floor(arearect.width / fontsizerect.width);
const numrows = Math.floor(arearect.height / fontsizerect.height);
cellSelected_x = cellSelected_y = 0;
text = "welcome to browser text editor!";
isInsertMode = false;

editor.addEventListener('dragenter', preventDefaults, false);
editor.addEventListener('dragleave', preventDefaults, false);
editor.addEventListener('dragover', preventDefaults, false);
editor.addEventListener('drop', preventDefaults, false);

filemodal.addEventListener('dragenter', preventDefaults, false);
filemodal.addEventListener('dragleave', preventDefaults, false);
filemodal.addEventListener('dragover', preventDefaults, false);
filemodal.addEventListener('drop', preventDefaults, false);

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

function dropHandler() {
    if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...e.dataTransfer.items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                const file = item.getAsFile();
                console.log(`… file[${i}].name = ${file.name}`);
            }
        });
    } else {
        // Use DataTransfer interface to access the file(s)
        [...e.dataTransfer.files].forEach((file, i) => {
            console.log(`… file[${i}].name = ${file.name}`);
        });
    }
}

function replaceAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1 * isInsertMode);
}

/*current position*/
function curr(offsetx = 0, offsety = 0) {
    return pos((cellSelected_x + offsetx), (cellSelected_y + offsety));
}

function pos(x = 0, y = 0){
    return y * numcols + x;
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

function moveCursor(new_x, new_y) {
    editor.rows[cellSelected_y].cells[cellSelected_x].classList.remove("selected");
    cellSelected_x = new_x;
    cellSelected_y = new_y;
    editor.rows[new_y].cells[new_x].classList.add("selected");
    document.title = "[" + cellSelected_x + "," + cellSelected_y + "]";
}

function moveCursorRight() {
    moveCursor(cellSelected_x + 1, cellSelected_y);
}

function moveCursorLeft() {
    moveCursor(cellSelected_x - 1, cellSelected_y);
}

function moveCursorUp() {
    moveCursor(cellSelected_x, cellSelected_y - 1);
}

function moveCursorDown() {
    moveCursor(cellSelected_x, cellSelected_y + 1);
}

function writeAtCell(x, y, c) {
    if (y * numrows + x >= text.length)
        text = text + c;
    else
    text = replaceAt(text, y * numrows + x, c);
}

function writeAtSelection(c) {
    writeAtCell(cellSelected_x, cellSelected_y, c);
}

function render_cell(x, y, c) {
    editor.rows[y].cells[x].innerText = c;
}

function render() {
    let index = 0;
    for (let row = 0; row < numrows; row++) {
        for (let col = 0; col < numcols; col++) {
            if (index < text.length) {
                render_cell(col, row, text[index]);
                index++;
            } else {
                render_cell(col, row, '');
            }
        }
    }
}

function update() {
    populateTable();
    render();
    editor.rows[cellSelected_y].cells[cellSelected_x].classList.add("selected");
}

function checkFileBounds() {
    if (curr() > text.length) {
        diff = curr() - text.length + 1;
        if (diff > numcols) {
            if (cellSelected_y > 0) {
                moveCursor(numcols - 1, cellSelected_y - 1);
            }
        } else {
            if (diff > 0) {
                if (cellSelected_x > 0) {
                    moveCursor(cellSelected_x - 1, cellSelected_y);
                } else {
                    if (cellSelected_y > 0) {
                        moveCursor(numcols - 1, cellSelected_y - 1);
                    }
                }
            } else {
                moveCursor(0, 0);
                // Reached the start of the file (0,0) - stop further recursion
                return;
            }
        }
        // Recurse only if further adjustments are still needed
        checkFileBounds();
    }
}

document.body.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key === 'ArrowRight' && cellSelected_x < numcols - 1) {
        moveCursorRight();
        checkFileBounds();
    } else if (e.key === 'ArrowLeft' && cellSelected_x > 0) {
        moveCursorLeft();
        checkFileBounds();
    } else if (e.key === 'ArrowDown' && cellSelected_y < numrows - 1) {
        moveCursorDown();
        checkFileBounds();
    } else if (e.key === 'ArrowUp' && cellSelected_y > 0) {
        moveCursorUp();
        checkFileBounds();
    } else if (e.key.length === 1) {
        writeAtSelection(e.key);
        update();
        moveCursorRight();
    } else if (e.key === ' ' && cellSelected_x < numcols - 1) {
        writeAtSelection(' ');
        update();
        moveCursorRight();
    } else if (e.key === 'Backspace' && cellSelected_x > 0) {
        moveCursorLeft();
        initialIsInsertMode = isInsertMode
        isInsertMode = true;
        writeAtSelection('');
        isInsertMode = !initialIsInsertMode;
        update();
    } else if (e.key === 'Enter') {
    } else if (e.key === 'Insert') {
        isInsertMode = !isInsertMode;
    } else if (e.key === 'Delete') {
        initialIsInsertMode = isInsertMode
        isInsertMode = true;
        writeAtSelection('');
        isInsertMode = !initialIsInsertMode;
        update();
    }
});

function main() {
    update();
}

