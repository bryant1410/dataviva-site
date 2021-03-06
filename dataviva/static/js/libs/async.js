var ajaxQueue = function(urls, callback, error) {
    var results = urls.slice(),
        queue = urls.slice(),
        config = {};

    var ready = function(result, url) {
        queue.splice(queue.indexOf(url), 1);
        if (result) results.splice(results.indexOf(url), 1, result);
        if (queue.length === 0 ) {
            callback(results);
        }
    }

    queue.forEach(function(url) {
        $.ajax({
            dataType: config['dataType'] || 'json',
            method: config['method'] || 'GET',
            url: url,
            success: function(result) { ready(result, url); },
            error: function(result) { if (error !== undefined) error(url); },
        });
    });
}

