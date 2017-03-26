/*
UI Things
Copyright (C) 2015-2016 jackw01

This program is distrubuted under the MIT License, see LICENSE for details
*/

$(".modal-close-button").click(function(event) {

    $(event.target).parent().parent().parent().fadeToggle(200);
});

$(".validate-whole-positive").blur(function(event) {

    $("#" + event.target.id).val(Math.round($("#" + event.target.id).val().replace(/\-/g, "")));

    var value = $("#" + event.target.id).val();

    if (isNaN(value) || value < 1) $("#" + event.target.id).addClass("text-input-error");
    else $("#" + event.target.id).removeClass("text-input-error");
});
