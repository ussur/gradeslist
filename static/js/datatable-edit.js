"use strict";
//Global variables
var table = null;
var params = null;
var inEdit = false;
var row, cell, columnIndex;
var buttons = '<div id="buttons" class="btn-group">'+
    '<button id="bAccept" type="button" class="btn btn-outline-dark" onclick="accept();">' + 
    '<span class="fas fa-check" ></span>'+
    '</button>'+
    '<button id="bCancel" type="button" class="btn btn-outline-dark" onclick="cancel();">' + 
    '<span class="fas fa-times" ></span>'+
    '</button>'+
    '</div>';


function TableEdit(dataTable, options) {
    var defaults = {
        editType: "row",
        editableColumns: null,        // Indices of editable columns. If null all columns are editable. Ex.: "1,2,3,4,5"
        $addButton: null,           // Jquery object of an "Add" button
        $deleteButton: null,        // Jquery object of a "Delete" button
        onEdit: function() {},      // Called after edition
        onDelete: function() {},    // Called after deletion
        onAdd: function() {}        // Called when a new row is added
    };
    params = $.extend(defaults, options);
	table = dataTable;
    //Click handler
    $(document).click(function(e) {
        if ($(e.target).closest('td').length > 0 && !inEdit) {
            //Row selection
            if (params.editType === "row") {
                var clickedRow = $(e.target).closest('tr');
                $(clickedRow).toggleClass('selected');
                return;
            }
            //Cell selection
            if (params.editType === "cell") {
                var clickedCell = $(e.target).closest('td');
                var idx = table.cell(clickedCell).index().column;
                if (params.editableColumns.includes(idx) &&
                    clickedCell.text() !== "")
                    $(clickedCell).toggleClass('selected');
                return;
            }
        }
        if ($(e.target).closest('input').length === 0) {
            if (inEdit) {
                accept();
                return;
            }
            if ($(e.target).closest('button').length === 0) {
                table.rows( '.selected' ).nodes().to$().toggleClass('selected');
                table.cells( '.selected' ).nodes().to$().toggleClass('selected');
            }
        }
    });
    //Process button parameters
    if (params.$addButton != null) {
        params.$addButton.click(function() {
            add();
        });
    }
    if (params.$deleteButton != null) {
        params.$deleteButton.click(function() {
            remove();
        });
    }
    //Bind edit to doubleclick on row\cell
    table.on('dblclick', 'td', function () {
        edit($(this));
    } );
    //KeyPress events
    $(document).keypress(function (e) {
        if (inEdit) {
            //Accept edit changes on Enter
            if (e.which == 13 || e.keyCode == 13) {
                accept();
            } else {
                //Abort edit changes on Esc
                if (e.which == 27 || e.keyCode == 27) {
                    cancel();
                }
            }
        }
    });
    //Individual column search
    table.columns().every(function() {
        var that = this;
        $('input', this.footer()).on( 'keyup change', function() {
            if ( that.search() !== this.value ) {
                that.search(this.value).draw();
            }
        } );
    });
};

function mapEditableCells(func) {
    //Iterate over editable cells of the row
    if (params.editType === "cell") {
        var idx = $(cell.node()).index();
        if (isEditable(idx))
            func(cell);
        return;
    }
    var $cells = $(row.node()).find('td');
    $cells.each(function() {
        var idx = $(this).index();
        if (!isEditable(idx)) return;   //Cell's not editable
        func(table.cell(this));
    });
    
    function isEditable(idx) {
    //Check if cell is editable by index
        if (params.editableColumns == null) {  //editableColumns is not defined - all cells are editable
            return true;
        } else {
            if (params.editableColumns.includes(idx)) return true;
            else return false;
        }
    }
}

function viewMode() {
    row = null; cell = null; columnIndex = null;
    inEdit = false;
}

function editMode($callingElement) {
    row = table.row($callingElement.parents('tr'));
    cell = table.cell($callingElement);
    columnIndex = cell.index().column;
    inEdit = true;
}

function edit($callingElement) {
    //Start editing a row
    if (inEdit) return;  //A row is already being edited
    editMode($callingElement);
    if (params.editType === "cell") {
        var input = '<div class="row"><div class="col-sm-6"><input class="form-control" value="' + cell.data() + '"></div><div class="col-sm">' + buttons + '</div></div>';
        $(cell.node()).html(input);
    }
    if (params.editType === "row") {
        mapEditableCells(function(cell) {
            var input = '<input class="form-control input-sm" value="' + cell.data() + '">';
            $(cell.node()).html(input);  //Change cell to input
        });
        var lastCell = table.cell($(row.node()).find('td:last'));
        var input = '<div class="row"><div class="col-sm-8"><input class="form-control" value="' + lastCell.data() + '"></div><div class="col-sm">' + buttons + '</div></div>';
        $(lastCell.node()).html(input);
    }
    $callingElement.find('input').focus();
}

function accept() {
    //Accept the changes made in a row
    if (!inEdit) return;  //The row is not being edited
    mapEditableCells(function(cell) {
        var newValue = $(cell.node()).find('input').val(); //read input
        cell.data(newValue)  //set cell content
    });
    params.onEdit(row, cell, columnIndex);
    viewMode();
}

function cancel() {
    //Abort the changes made in a row
    if (!inEdit) return;  //The row is not being edited
    mapEditableCells(function(cell) {
        $(cell.node()).html(cell.data());
    });
    viewMode();
}

function remove() {
    if (params.editType === "row")
        removeRows();
    else if (params.editType === "cell")
        removeCells();
}

function removeRows() {  
    var rows = table.rows('.selected');
    if (rows[0].length > 0 && !inEdit) {
        var confirmation = bootbox.confirm({
            size: "small",
            message: "Вы действительно хотите удалить записи?",
            buttons: {
                confirm: {
                    label: 'Да',
                    className: 'btn-info'
                },
                cancel: {
                    label: 'Нет',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                if (result) {
                    params.onDelete(rows);
                    rows.remove().draw(false);
                }
            }
        });
    }
}

function removeCells() {
    var cells = table.cells('.selected');
    if (cells[0].length > 0 && !inEdit) {
        var confirmation = bootbox.confirm({
            size: "small",
            message: "Вы действительно хотите удалить записи?",
            buttons: {
                confirm: {
                    label: 'Да',
                    className: 'btn-info'
                },
                cancel: {
                    label: 'Нет',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                if (result) {
                    params.onDelete(cells[0]);
                }
            }
        });
    }
}

function add() {  
    params.onAdd();
}
