document.addEventListener("DOMContentLoaded", function () {

    let params = (new URL(document.location)).searchParams;
    let highlight = params.get("highlight");
    var element = document.querySelector(highlight);

    if (highlight != null) {
        var Highlighter = new window.Highlighter({
            'scroll': true, //Automatically scroll to the underlined element
            'scrollDuration': 500, //milliseconds
            'color': '#4fc08d',
        });
        Highlighter.point(element);
        Highlighter.underline();
    }


});