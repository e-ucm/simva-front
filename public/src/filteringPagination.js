/**
 * Class that defines the basic behavior for handling the parameters of the filtering and pagination of a specific element 
 */
class FilteringPagination {
    /**
     * @param {object} $rootElem - jquery object reference of the root element in the hierarchy of the filtering and pagination elements
     */
    constructor($rootElem) {
        this.$searchBar = $rootElem.find(".filteringSearchBar");
        this.$sortBy = $rootElem.find(".filteringSortBy");
        this.$status = $rootElem.find(".filteringStatus");
        
        this.showAtOnce = 1;        // Maximum amount of results that will be returned on each search
        this.currentPage = 1;       // "Page" from where the search will take the results (used to calculate skip and limit)
        this.totalResults = 1;      // Amount of results available for the search
        this.totalPages = 0;

        // Default callbacks. To change their behavior, a function needs to be asigned as their value
        this.updateSearchCallback = () => { };      // Called when updating a search to get new results
        this.checkBottomReached = false;            // Allow/block checking if the page is scrolled all the way down 
                                                    // (to prevent it from instantly updating the current page number 
                                                    // after repainting the results, which makes it skip the first page)

        this.checkLoadMore = () => { return true; } // Called to check extra conditions to know when to load more results
        this.loadMoreCallback = () => { };          // Called to load more results in the current search

        this.searchTimerInterval = 200;     // Time in ms to wait before performing a search update
        this.searchTimer = null;

        // Object that defines the parameters that will be passed to the api calls as a query
        // The default parameters common all calls are:
        // - skip (pagination)
        // - limit (pagination)
        // - searchString (filtering)
        // - orderBy (filtering)
        // - order (filtering)
        // Other parameters that are exclusive to certain calls are searchTags or status
        // When calling the /count endpoints, only searchString and the exclusive parameters will be taken into account
        this.searchParams = { };


        $(window).scroll(() => {
            this.bottomReached();
        });

        this.$searchBar.on("input", () => {
            this.resetSearchTimer();
        });

        this.$sortBy.on("change", () => {
            this.resetSearchTimer();
        });

        if (this.$status.length) {
            this.$status.on("change", () => {
                console.log("sdfhlkn")
                this.resetSearchTimer();
            });
        }
    }

    // Update the search parameters
    updateSearchOptions() {
        this.totalPages = Math.ceil(this.totalResults / this.showAtOnce);

        if (this.totalPages < 1) {
            this.totalPages = 1;
        }
        
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
        else if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        this.searchParams.skip = (this.currentPage - 1) * this.showAtOnce;
        this.searchParams.limit = this.currentPage * this.showAtOnce;
        this.searchParams.searchString = this.$searchBar.val().trim().toLowerCase() || "";
        this.searchParams.orderBy = this.$sortBy.val() || "id";
        this.searchParams.order = this.$sortBy.find("option:selected").data("order") || "desc";

        if (this.$status.length) {
            this.searchParams.status = this.$status.val() || "";
        }
    }

    // Update the search parameters and call the update function
    updateSearch() {
        this.currentPage = 1;
        this.updateSearchOptions();
        this.updateSearchCallback();
    }

    // Check if the page has been scrolled all the way down to load more results
    bottomReached() {
        if (this.checkBottomReached) {
            // Calculate the distance to the bottom
            // IMPORTANT: $(window).scrollTop(), $(document).height() and $(window).height() 
            // behave differently on different browsers so jquery can't be used to calculate
            // if the page is scrolled all the way to the bottom
            const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
            const distanceToBottom = scrollHeight - scrollTop - clientHeight;
            
            if (Math.abs(distanceToBottom) < 1) {
                // If there are still pages to load, update the current page and load more
                if (this.currentPage < this.totalPages && this.checkLoadMore()) {
                    this.currentPage++;
                    this.updateSearchOptions();
                    this.loadMoreCallback();
                }
            }
        }
    }
    
    // Before updating the search results, wait a certain time to ensure the user is done changing parameters
    resetSearchTimer() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.updateSearch();
        }, this.searchTimerInterval);
    }
}