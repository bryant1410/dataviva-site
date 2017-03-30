var stacked = document.getElementById('stacked'),
    dataset = stacked.getAttribute('dataset'),
    filters = stacked.getAttribute('filters'),
    area = stacked.getAttribute('area'),
    baseTitle = stacked.getAttribute('graph-title'),
    baseSubtitle = stacked.getAttribute('graph-subtitle'),
    depths = DEPTHS[dataset][area],
    group = depths[0],
    size = stacked.getAttribute('size'),
    sizes = SIZES[dataset][area],
    yearRange = getUrlArgs()['year'] ? [0, +getUrlArgs()['year']] : [0, 0],
    basicValues = BASIC_VALUES[dataset],
    calcBasicValues = CALC_BASIC_VALUES[dataset];


var buildData = function(apiResponse, areaMetadata, groupMetadata) {
    
    var getAttrByName = function(item, attr) {
        var index = headers.indexOf(attr);
        return item[index];
    };

    var data = [];
    var headers = apiResponse.headers;

    apiResponse.data.forEach(function(item) {
        try {
            var dataItem = {};

            headers.forEach(function(header) {
                dataItem[header] = getAttrByName(item, header);
                if (['wage', 'average_wage'].indexOf(header) >= 0)
                    dataItem[header] = +dataItem[header]
            });

            if (group && HAS_ICONS.indexOf(group) >= 0)
                dataItem['icon'] = '/static/img/icons/' + group + '/' + group + '_' + dataItem[group] + '.png';
            
            if (area in DICT[dataset]['item_id'])
                dataItem[DICT[dataset]['item_id'][area]] = dataItem[area];

            for (key in calcBasicValues)
                dataItem[key] = calcBasicValues[key](dataItem);

            depths.forEach(function(depth) {
                if (depth != area)
                    dataItem[depth] = areaMetadata[dataItem[area]][depth]['name_' + lang];
            });
           
            dataItem[area] = areaMetadata[dataItem[area]]['name_' + lang];
            

            data.push(dataItem);
        } catch(e) {

        };
    });

    return data;
}

var loadViz = function (data){

    var titleHelper = function(depth) {
        var title = titleBuilder(depth, dataset, getUrlArgs(), yearRange);
        return {
            'value': title['title'],
            'font': {'size': 22, 'align': 'left'},
            'sub': {'font': {'align': 'left'}, 'value': title['subtitle']},
            'total': {'font': {'align': 'left'}, 'value': true}
        }
    };

    var timelineCallback = function(years) {
        yearRange = years.length == 1 ? [0, years[0].getFullYear()] : [years[0].getFullYear(), years[years.length - 1].getFullYear()];
        toolsBuilder(viz, data, titleHelper().value, uiBuilder());
        viz.title(titleHelper());
    };

    var tooltipBuilder = function() {
        return {
            'short': {
                '': DICT[dataset]['item_id'][area],
                [dictionary['basic_values']]: 'value'
            },
            'long': {
                '': DICT[dataset]['item_id'][area],
                [dictionary['basic_values']]: basicValues.concat(Object.keys(calcBasicValues))
            }
        }
    };

    var uiBuilder = function() {
        ui = [];

        ui.push( {
            "label": "Layout",
            "type" : "drop",
            "value" : [
                {
                    [dictionary['year']]: "linear"
                }, 
                {
                    [dictionary['share']]: "share"
                }
            ],
            "method" : function(value, viz){
                viz.y({
                    "scale": value
                })
                .draw();
            }
        });

        ui.push({
            "label": dictionary['sort'],
            "type": "drop",
            "value": [
                {
                    [dictionary['desc']] : "desc"
                },
                {
                    [dictionary['asc']] : "asc"
                }
            ],
            "method": function(value, viz){
                viz.order({
                    "sort": value
                }).draw();
            }
        });

        ui.push({
            "label": dictionary['Order'],
            "type": "drop",
            "value": [
                {
                    [dictionary['value']] : "value"
                },
                {
                    [dictionary['name']] : "name"
                }
            ],
            "method": function(value, viz){

                if (value == "value"){
                    value = viz.y();
                }
                else {
                    value = viz.id();
                }

                viz.order({
                    "value": value
                }).draw();
            }
        });

        if (dataset == 'secex'){
            ui.push({
                "label": dictionary['time'],
                "value": [
                    {
                        [dictionary['year']]: "year"
                    },
                    {
                        [dictionary['month']]: "month"
                    }
                ],
                "method": function(value, viz){
                    viz.x({
                            "value": value,
                            "label": value
                    });
                    viz.time({
                        "value": value
                    }).draw();
                }
            });
        }

        if (dataset == 'rais'){
            var axis_values = [];

            for (var i = 0, len = values.length; i < len; i++) {
              axis_values.push({[dictionary[values[i]]] : values[i]})
            }

            ui.push({
                "label": dictionary['y'],
                "type": "drop",
                "value": axis_values,
                "method": function(value, viz){

                    viz.y({
                        "value": value,
                        "label": yAxisLabelBuilder(value)
                    });

                    viz.order({
                        "value": value
                    }).draw();
                }
            });
        }

        return ui;
    }

    var yAxisLabelBuilder = function (type) {
        if(type == 'value')
            return size == 'value_per_kg' ? dictionary['exports_weight'] : dictionary['exports'];

        if(type == 'jobs')
            return dictionary['total_jobs']

        if(type == 'wage')
            return dictionary['wage']
        
        if(type == 'establishment_count')
            return dictionary['establishment_count']
    };
    
    data_type = {"value": size, "label": yAxisLabelBuilder(size)}

    var viz = d3plus.viz()
        .container("#stacked")
        .data(data)
        .type("stacked")
        .y(data_type)  
        .x({"value": "year", "label": ""})
        .axes({"background": {"color": "white"}})
        .background("transparent")
        .time("year")
        .icon(group == 'state' ? {'value': 'icon'} : {'value': 'icon', 'style': 'knockout'})
        .legend({'filters': true, 'order': {'sort': 'desc', 'value': 'size'}})
        .footer(dictionary['data_provided_by'] + ' ' + dataset.toUpperCase())
        .title(titleHelper(area))
        .shape({"interpolate": "monotone"})
        .tooltip(tooltipBuilder())
        .ui(uiBuilder())
        .format(formatHelper())

        if (group) {
            viz.color(group);
        }

        if (depths[0] == '') {
            viz.id({'value': area})
        } else {
            viz.id(depths);
        }

        viz.draw()

        toolsBuilder(viz, data, titleHelper().value, uiBuilder());
}

var getUrls = function() {
    var dimensions = [dataset, (dataset == 'secex' ? 'month/year' : 'year'), area];
    if (group && depths.length && depths.indexOf(group) == -1 || !depths.length)
        dimensions.push(group);
    depths.forEach(function(depth) {
        if (depth != area)
            dimensions.push(depth);
    });

    var urls = ['http://api.staging.dataviva.info/' + dimensions.join('/') + '?' + filters,
        'http://api.staging.dataviva.info/metadata/' + area
    ];

    return urls;
};

var areaMetadata = [],
    groupMetadata = [];

var loading = dataviva.ui.loading('.loading').text(dictionary['loading'] + '...');


$(document).ready(function() {
    ajaxQueue(
        getUrls(), 
        function(responses) {
            var data = responses[0];
            areaMetadata = responses[1];
            if (group)
                groupMetadata = responses[2];

            data = buildData(data, areaMetadata, groupMetadata);

            loadViz(data);

            loading.hide();
            d3.select('#mask').remove();
        }
    );
});