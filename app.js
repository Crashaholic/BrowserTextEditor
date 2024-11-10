const editor = document.getElementById('text-editor');
const font_size_rect = document.getElementById("measureText").getBoundingClientRect();
const area_rect = document.getElementById("measureArea").getBoundingClientRect();
const numcols = Math.floor(area_rect.width / font_size_rect.width);
const numrows = Math.floor(area_rect.height / font_size_rect.height);
cell_selected_x = cell_selected_y = 0;
text = "welcome to browser text editor!";
isInsertMode = false;

function replaceAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1 * isInsertMode);
}

/*current position*/
function curr(offsetx = 0, offsety = 0) {
    return pos((cell_selected_x + offsetx), (cell_selected_y + offsety));
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
            cell.style.height = "" + font_size_rect.height + "px";
            cell.style.fontSize = "" + (font_size_rect.height - 2) + "px";
            row.appendChild(cell);
        }
        editor.appendChild(row);
    }
}

function moveCursor(new_x, new_y) {
    editor.rows[cell_selected_y].cells[cell_selected_x].classList.remove("selected");
    cell_selected_x = new_x;
    cell_selected_y = new_y;
    editor.rows[new_y].cells[new_x].classList.add("selected");
    document.title = "[" + cell_selected_x + "," + cell_selected_y + "]";
}

function moveCursorRight() {
    moveCursor(cell_selected_x + 1, cell_selected_y);
}

function moveCursorLeft() {
    moveCursor(cell_selected_x - 1, cell_selected_y);
}

function moveCursorUp() {
    moveCursor(cell_selected_x, cell_selected_y - 1);
}

function moveCursorDown() {
    moveCursor(cell_selected_x, cell_selected_y + 1);
}

function writeAtCell(x, y, c) {
    if (y * numrows + x >= text.length)
        text = text + c;
    else
        text = replaceAt(text, y * numrows + x, c);
}

function writeAtSelection(c) {
    writeAtCell(cell_selected_x, cell_selected_y, c);
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
    editor.rows[cell_selected_y].cells[cell_selected_x].classList.add("selected");
}

function checkFileBounds() {
    if (curr() > text.length) {
        diff = curr() - text.length + 1;
        if (diff > numcols) {
            if (cell_selected_y > 0) {
                moveCursor(numcols - 1, cell_selected_y - 1);
            }
        } else {
            if (diff > 0) {
                if (cell_selected_x > 0) {
                    moveCursor(cell_selected_x - 1, cell_selected_y);
                } else {
                    if (cell_selected_y > 0) {
                        moveCursor(numcols - 1, cell_selected_y - 1);
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
    if (e.key === 'ArrowRight' && cell_selected_x < numcols - 1) {
        moveCursorRight();
        checkFileBounds();
    } else if (e.key === 'ArrowLeft' && cell_selected_x > 0) {
        moveCursorLeft();
        checkFileBounds();
    } else if (e.key === 'ArrowDown' && cell_selected_y < numrows - 1) {
        moveCursorDown();
        checkFileBounds();
    } else if (e.key === 'ArrowUp' && cell_selected_y > 0) {
        moveCursorUp();
        checkFileBounds();
    } else if (e.key.length === 1) {
        writeAtSelection(e.key);
        update();
        moveCursorRight();
    } else if (e.key === ' ' && cell_selected_x < numcols - 1) {
        writeAtSelection(' ');
        update();
        moveCursorRight();
    } else if (e.key === 'Backspace' && cell_selected_x > 0) {
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

function processDrop(ev) {
    ev.preventDefault();
    alert("a!!!");
}

function processDragOver(ev) {
    ev.preventDefault();
}
    
function main() {
    update();
}

