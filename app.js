const editor = document.getElementById('text-editor');
const font_size_rect = document.getElementById("measureText").getBoundingClientRect();
const area_rect = document.getElementById("measureArea").getBoundingClientRect();
const numcols = area_rect.width / font_size_rect.width;
const numrows = Math.floor(area_rect.height / font_size_rect.height);
cell_selected_x = cell_selected_y = 0;
background_text = "abcd";
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
    if (y * numrows + x >= background_text.length)
        background_text = background_text + c;
    else
        background_text = replaceAt(background_text, y * numrows + x, c);
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
            if (index < background_text.length) {
                render_cell(col, row, background_text[index]);
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

function checkIfEndOfFile() {
    if (curr() > background_text.length) {
        editor.rows[cell_selected_y].cells[cell_selected_x].classList.remove("selected");
        diff = curr() - background_text.length + 1;
        if (diff > numcols) {
            if (cell_selected_y > 0) {
                cell_selected_y -= 1;
                cell_selected_x = numcols - 1; // Move to the last cell of the previous row
            }
        } else {
            if (diff > 0) {
                if (cell_selected_x > 0) {
                    cell_selected_x -= 1;
                } else {
                    if (cell_selected_y > 0) {
                        cell_selected_y -= 1;
                        cell_selected_x = numcols - 1;
                    }
                }
            } else {
                cell_selected_x = cell_selected_y = 0;
                // Reached the start of the file (0,0) - stop further recursion
                return;
            }
        }
        // Recurse only if further adjustments are still needed
        checkIfEndOfFile();
        editor.rows[cell_selected_y].cells[cell_selected_x].classList.add("selected");
    }
}

document.body.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && cell_selected_x < numcols - 1) {
        e.preventDefault();
        moveCursorRight();
        checkIfEndOfFile();
    } else if (e.key === 'ArrowLeft' && cell_selected_x > 0) {
        e.preventDefault();
        moveCursorLeft();
        checkIfEndOfFile();
    } else if (e.key === 'ArrowDown' && cell_selected_y < numrows - 1) {
        e.preventDefault();
        moveCursorDown();
        checkIfEndOfFile();
    } else if (e.key === 'ArrowUp' && cell_selected_y > 0) {
        e.preventDefault();
        moveCursorUp();
        checkIfEndOfFile();
    } else if (e.key.length === 1) {
        writeAtSelection(e.key);
        update();
        moveCursorRight();
    } else if (e.key === ' ' && cell_selected_x < numcols - 1) {
        e.preventDefault();
        writeAtSelection(' ');
        update();
        moveCursorRight();
    } else if (e.key === 'Backspace' && cell_selected_x > 0) {
        e.preventDefault();
        moveCursorLeft();
        initialIsInsertMode = isInsertMode
        isInsertMode = true;
        writeAtSelection('');
        isInsertMode = !initialIsInsertMode;
        update();
    } else if (e.key === 'Enter') {
        e.preventDefault();
    } else if (e.key === 'Insert') {
        e.preventDefault();
        isInsertMode = !isInsertMode;
    }
});
    
function main() {
    update();
}

