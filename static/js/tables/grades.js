$(document).ready( function () {
    var subject_id = null;
    //Validate form selectors
    function formValidation() {
        var form = document.getElementById('formGrades');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (form.checkValidity() === false) {
                event.stopPropagation();
            } else {
                grades.ajax.reload();
                grades.columns.adjust().draw();
                subject_id = $('#subject_id')[0][$('#subject_id')[0].selectedIndex].value;
            }
            form.classList.add('was-validated');
        }, false);
    }
    //Populate subject select in form
    function subjectSelect() {
        $.ajax({
                type: "POST",
                url: "/subjects_ajax",
                success: function(response){
                    var opts = response['data'];
                    $.each(opts, function(i, subject) {
                        $('#subject_id').append('<option value="' + subject.id + '">' + subject.name + '</option>');
                    });
                }
            });
    }
    //Populate group select in form
    function groupSelect() {
        $.ajax({
                type: "POST",
                url: "/groups_ajax",
                success: function(response){
                    var opts = response['data'];
                    $.each(opts, function(i, x) {
                        $('#group').append('<option value="' + x[0] + '">' + x[0] + '</option>');
                    });
                }
            });
    }
    //Populate year select in form
    function yearSelect() {
        $.ajax({
                type: "POST",
                url: "/years_ajax",
                success: function(response){
                    var opts = response['data'];
                    $.each(opts, function(i, x) {
                        $('#year').append('<option value="' + x[0] + '">' + x[0] + '</option>');
                    });
                }
            });
    }
    
    var grades = $('#grades').DataTable({
        responsive: true,
        processing: true,
        ajax: {
            url: '/grades_ajax',
            type: 'POST',
            dataType: "json",
            dataSrc: "data",
            contentType: "application/json",
            data: function () {
                data = {};
                $('#formGrades select').each(function() {
                    if (!this[this.selectedIndex].value) { 
                        data = {};
                        return; 
                    }
                    data[this.id] = this[this.selectedIndex].value;
                });
                return JSON.stringify(data);
            }
        },
        sPaginationType: "full_numbers",
        columns: [
            { "data": "student_id" },
            { "data": "student_name" },
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
            {
                text: '<i class="fas fa-trash-alt">',
                className: 'delete',
                titleAttr: 'Ctrl+D Удалить оценки',
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
    
    subjectSelect();
    groupSelect();
    yearSelect();
    formValidation();
    
    TableEdit(grades, {
        editType: "cell",
        editedColumns: "2, 3, 4, 5",
        $deleteButton: $('.delete'),
        onEdit: function(row, cell, columnIndex) {
            data = getRowData(grades, row);
            data['subject_id'] = subject_id;
            data['stage'] = grades.column(columnIndex).header()['id'];
            $.ajax({
                type: 'POST',
                url: '/edit_grade',
                contentType : 'application/json',
                data: JSON.stringify(data),
                dataType: 'json',
                error: function(err) {
                    bootbox.alert('Произошла непредвиденная ошибка во время текущей операции. Проверьте корректность введенных данных.');
                }
            });
        },
        onDelete: function(cells) {
            var data = []
            $(cells).each(function() {
                var grade = {}
                grade['subject_id'] = subject_id;
                grade['student_id'] = grades.row(this['row']).data()['student_id'];
                grade['stage'] = grades.column(this['column']).header()['id'];
                data.push(grade);
            });
            $.ajax({
                type: 'POST',
                url: '/delete_grades',
                contentType : 'application/json',
                data: JSON.stringify(data),
                dataType: 'json',
                success: function(response) {
                    grades.ajax.reload();
                },
                error: function(err) {
                    bootbox.alert('Произошла непредвиденная ошибка во время текущей операции.');
                }
            });
        }
    });
});