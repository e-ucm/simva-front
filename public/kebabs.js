function hideAllKebabs(time = 100) {
    $('.kebab-dropdown:visible').fadeOut(time);
}

hideAllKebabs(0);

// Close all kebab menus when clicking on one and showing the one that has been clicked
$(document).on('click', '.kebab', function (e) {
    e.stopPropagation();
    e.preventDefault();
    let dropdown = $(this).find(".kebab-dropdown").first();
    if (!dropdown.is(":visible")) {
        hideAllKebabs();
    }
    dropdown.fadeToggle(100)
});

// Close when clicking inside the kebab dropdown and prevent from opening again
$(document).on('click', '.kebab-dropdown, .kebab-dropdown *', function (e) {
    hideAllKebabs();
    e.stopPropagation();
});

// Close all kebab menus when clicking anywhere on the page if there's no other kebab being clicked
$(document).on('click', function (e) {
    if (!$(e.target).closest('.kebab').length) {
        hideAllKebabs();
    }
});