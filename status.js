let section_left = "";
let section_right = "";
let component_left = "";
let component_right = "";

statusCxt.registerStatusBarAddon({
    "mode_show" : () => {
        let current_mode = statusCxt.getEditorMode();
        let modeMarker = "";
        switch (current_mode)
        {
            case EditorMode.NORMAL: {
                modeMarker += " N ";
                break;
            }
            case EditorMode.INSERT: {
                modeMarker += " I ";
                break;
            }
            case EditorMode.VISUAL: {
                modeMarker += " V ";
                break;
            }
            case EditorMode.VISUALLINE: {
                modeMarker += " V LINE ";
                break;
            }
            case EditorMode.VISUALBLOCK: {
                modeMarker += " V BLOCK ";
                break;
            }
            default:
            break;
        };
        for (let x = 0; x < modeMarker.length; x++) {
            cell = statusCxt.renderCell(x + 3, statusCxt.getBoundsY() - 2, modeMarker[x]);
            cell.removeAttribute('class');
            cell.classList.add("fg_white");
            cell.classList.add("bg_blue");
        }
        let leftDecor = statusCxt.renderCell(2, statusCxt.getBoundsY() - 2, section_left);
        let rightDecor = statusCxt.renderCell(3 + modeMarker.length, statusCxt.getBoundsY() - 2, section_left);
        leftDecor.removeAttribute('class');
        leftDecor.classList.add("bg_blue");
        leftDecor.classList.add("fg_darkcyan");
        
        rightDecor.removeAttribute('class');
        rightDecor.classList.add("fg_blue");
        rightDecor.classList.add("bg_darkcyan");
    },
    "fill" : () => {
        for (let x = 0; x < statusCxt.getBoundsX(); x++) {
            cell = statusCxt.getCellAt(x, statusCxt.getBoundsY() - 2);
            cell.removeAttribute('class');
            cell.classList.remove("bg_white");
            cell.classList.add("bg_darkcyan");
        }
    },
    "insert_status" : () => {
        a = statusCxt.getInputInsertMode();
        let str = "";
        if (a) 
            str = "INS";
        else
            str = "REP";
        for (let x = 0; x < str.length; x++) {
            statusCxt.renderCell(statusCxt.getBoundsX() - 15 - locationMarker.length + x, statusCxt.getBoundsY() - 2, str[x]);
        }
    }
});
