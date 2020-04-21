$(document).ready( function () {
    var grades = $('#grades').DataTable({
        responsive: true,
        paging: true,
        pageLength: -1,
        ajax: {
            url: '/student_grades_ajax',
            type: 'POST',
            dataType: "json",
            dataSrc: "data",
            contentType: "application/json"
        },
        columns: [
            { "data": "subject_name" },
            { 
                "data": "1", 
                "defaultContent": ""
            },
            { 
                "data": "2", 
                "defaultContent": ""
            },
            { 
                "data": "3", 
                "defaultContent": ""
            },
            { 
                "data": "4", 
                "defaultContent": ""
            }
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
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Все"]],
        language: {
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
});