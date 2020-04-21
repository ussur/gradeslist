$(document).ready( function () {
    var subjects = $('#subjects').DataTable({
        "processing": true,
        ajax: {
            url: '/subjects_ajax',
            type: 'POST',
            "dataType": "json",
            "dataSrc": "data",
            "contentType": "application/json"
        },
        "sPaginationType": "full_numbers",
        "columns": [
            { "data": "id" },
            { "data": "name" },
            { "data": "year" },
            { "data": "term" }
        ],
        dom: "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"+
                "<'row'<'col-sm-12 col-md-5'l>>",
        buttons: [
            'csv', 'excel', 'pdf',
            ],
        scrollY: '100vh',
        scrollCollapse: true,
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Все"]],
        "language": {
            "decimal":        ",",
            "emptyTable":     "Таблица пуста",
            "info":           "Запись с _START_ по _END_ из _TOTAL_",
            "infoEmpty":      "Запись с 0 по 0 из 0",
            "infoFiltered":   "(найдено из _MAX_ записей)",
            "infoPostFix":    "",
            "thousands":      " ",
            "lengthMenu":     "Показывать _MENU_ записей",
            "loadingRecords": "Загрузка...",
            "processing":     "Идёт обработка...",
            "search":         "Поиск:",
            "zeroRecords":    "Ничего не найдено",
            "paginate": {
                "first":      "Первая",
                "last":       "Последняя",
                "next":       "Следующая",
                "previous":   "Предыдущая"
            },
            "aria": {
                "sortAscending":  ": активировать для сортировки по возрастанию",
                "sortDescending": ": активировать для сортировки по убыванию"
            }
        }
    });
    
    subjects.columns().every(function() {
        var that = this;
        $('input', this.footer()).on( 'keyup change', function() {
            if ( that.search() !== this.value ) {
                that.search(this.value).draw();
            }
        } );
    });
});