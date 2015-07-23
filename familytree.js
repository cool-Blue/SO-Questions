var familytreesearchsuggestions = "#familytreesearchsuggestions";
var familytreesearchsuggestionsFamilycreatures = "#familytreesearchsuggestionsFamilycreatures";

$("#familytreecontentclose a").click(function () {
    $("#familytree").hide();
    $("#familytreecontent").children().hide();
    $("#illustrator").css("z-index", "19");
});

$("#familytreeShowallbutton").click(function () {
    if(familytree.getAlreadyThere()) familytree.createGraph(); else orientdb.getFamilytreeAll();
});

$("#familytreeHideallbutton").click(function () {
    familytree.cleanPresentation();
});

d3.select('#familytreeUnfixallbutton').on('click', function () {
    d3.selectAll('#familytreecontentsvg .node')
        .each(function (d) {
            d.fixed = false;
        })
        .classed("fixed", false)
});

$("#familytreesearch").on('input', function () {
    if ($("#familytreesearch").val() == ""){
        $(familytreesearchsuggestions).hide();
    } else {
        $(familytreesearchsuggestions).show();
        orientdb.search4Creature("#familytreesearch", familytreesearchsuggestionsFamilycreatures);
    }
});

$("ul" + familytreesearchsuggestionsFamilycreatures).on('click', 'li', function () {
    orientdb.getFamilytreeSingle(this.id);
    $(this).addClass("active");
});

$("ul" + familytreesearchsuggestionsFamilycreatures).on('mouseenter mouseleave', 'li', function () {
    $(this).toggleClass("highlight");
});

$("#familytreesearch").attr('autocomplete', 'off');

$("#familytreecontentclose").mouseenter(function () {
    if (ardamap.getCurrentAge() == ""){
        $("#familytreeinner a").attr("href", "/");
    }
    if (ardamap.getCurrentAge() == "first"){
        $("#familytreeinner a").attr("href", "/ages/first/");
    }
    if (ardamap.getCurrentAge() == "second"){
        $("#familytreeinner a").attr("href", "/ages/second/");
    }
    if (ardamap.getCurrentAge() == "third"){
        $("#familytreeinner a").attr("href", "/ages/third/");
    }
});