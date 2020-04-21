// common functions
function getRowData(table, row) {
    var data = {};
    $.each($(row.node()).find("td"), function() {
        var idx = table.cell(this).index().column;
        data[table.column(idx).header()['id']] = $(this).text();               
    });
    return data;
}