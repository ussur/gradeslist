// table enablers
$(document).ready( function () {
    var subjects = $('#subjects').DataTable({
        processing: true,
        ajax: {
            url: '/subjects_ajax',
            type: 'POST',
            dataType: "json",
            dataSrc: "data",
            contentType: "application/json"
        },
        sPaginationType: "full_numbers",
        columns: [
            { "data": "id" },
            { "data": "name" },
            { "data": "year" },
            { "data": "term" }
        ],
        dom: "<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"+
                "<'row'<'col-sm-12 col-md-5'l>>",
        responsive: true, 
        buttons: [
            {
                text: '<i class="fas fa-plus"></i>',
                className: 'add',
                titleAttr: 'Ctrl+A Добавить предмет',
                key: {
                    key: 'a',
                    ctrlKey: true
                }
            },
            {
                text: '<i class="fas fa-trash-alt">',
                className: 'delete',
                titleAttr: 'Ctrl+D Удалить предметы',
                key: {
                    key: 'd',
                    ctrlKey: true
                }
            },
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
    
    TableEdit(subjects, {
        editedColumns: "1, 2, 3",
        $addButton: $('.add'),
        $deleteButton: $('.delete'),
        onAdd: function() {
            $.ajax({
                type: 'POST',
                url: '/add_subject',
                contentType : 'application/json',
                dataType: 'json',
                success: function(response) {
                    subjects.row.add({
                        "id": response["id"],
                        "name": "",
                        "year": "",
                        "term": ""
                        }).draw()
                },
                error: function(err) {
                    bootbox.alert('Произошла непредвиденная ошибка во время текущей операции.');
                }
            });
        },
        onEdit: function(row, cell, columnIndex) {
            data = getRowData(subjects, row);
            $.ajax({
                type: 'POST',
                url: '/edit_subject',
                contentType : 'application/json',
                data: JSON.stringify(data),
                dataType: 'json',
                error: function(err) {
                    bootbox.alert('Произошла непредвиденная ошибка во время текущей операции. Проверьте корректность введенных данных.');
                    cancel();
                }
            });
        },
        onDelete: function(rows) {
            var ids = [];
            subjects.rows('.selected').every(function() {
                ids.push(this.data()['id']);
            });
            /* Doesn't work for some reason - gets the same id
            $(rows).each(function() {
                ids.push(subjects.row(this).data()['id']);
            });
            */
            $.ajax({
                type: 'POST',
                url: '/delete_subjects',
                contentType : 'application/json',
                data: JSON.stringify({ 'ids': ids }),
                dataType: 'json',
                error: function(err) {
                    bootbox.alert('Произошла непредвиденная ошибка во время текущей операции.');
                }
            });
        }
    });
});