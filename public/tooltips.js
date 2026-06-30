const OFFSET_X = 20;
const OFFSET_Y = 20;

// Position the tooltip text correctly regardless of the position of the icon and the amount of scroll
// (the tooltip needs to have its position as fixed to correctly paint on top of overflow hidden areas)
$(document).on("mouseenter", ".tooltip", function (e) {
    const tooltip = $(this);
    const tooltiptext = tooltip.find(".tooltiptext");

    const tooltipRelativeX = tooltip.offset().left - window.scrollX;
    const tooltipRelativeY = tooltip.offset().top - window.scrollY;

    let left = tooltipRelativeX + OFFSET_X;
    let top = tooltipRelativeY + OFFSET_Y;

    // Position the text on the bottom right of the icon by default
    setTooltipTextPostion(tooltiptext, top, left);
    
    let out = false;
    
    // If the text is horizontally out of the window, put it on the left of the icon
    if (tooltiptext[0].getBoundingClientRect().right > window.innerWidth) {
        left = tooltipRelativeX - tooltiptext.width() - OFFSET_X;
        out = true;
    }
    // If the text is vertically out of the window, put it on top of the icon
    if (tooltiptext[0].getBoundingClientRect().bottom > window.innerHeight) {
        top = tooltipRelativeY - tooltiptext.height() - OFFSET_Y;
        out = true;
    }
    
    // Reposition the text
    if (out) {
        setTooltipTextPostion(tooltiptext, top, left);
    }
});

const setTooltipTextPostion = function(tooltiptext, top, left) {
    tooltiptext.css({
        top: top,
        left: left,
    });
}