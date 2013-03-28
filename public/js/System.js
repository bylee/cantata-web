( function() {

    System = Model.extend( {} );

    SystemStorage = Model.extend( {
        defaults: {
            total: "",
            usage: "",
            remainder: ""
        },
        url: function() {
            return '/system/storage';
        }
    });

    SystemInfoView = WindowView.extend( {
        templateId: '#system-storage',

        initialize: function() {
            Logger.trace( 'system info view init' );
            this.model.bind( 'change', this.createContents, this );
            this.model.fetch();
            this.$storageChart = $( this.template( this.model ) );
        },

        getTitle: function() {
            return 'Storage';
        },

        createContents: function() {
            Logger.trace( 'create system info view' );
            var storage = this.model;

            var t = this.model.get( 'inTotalSize' );
            var u = this.model.get( 'inTotalUsage' );
            var r = this.model.get( 'inRemainder' );

            Logger.trace( 'Total: ' + t + ', Usage: ' + u + ', Remain: ' + r );
            this.$body.append( this.$storageChart );
            var data = [['Usage',Number(u)], ['Remain',Number(r)] ];
         
            var chart = $.jqplot('storage-pie', [data], {
                    grid: {
                    drawBorder: false, 
                    drawGridlines: false,
                    background: '#ffffff',
                    shadow:false
                },
                axesDefaults: {
                 
                },
                seriesDefaults:{
                    renderer:$.jqplot.PieRenderer,
                    rendererOptions: {
                        showDataLabels: true
                    }
                },
                legend: {
                    show: true,
                    rendererOptions: {
                        numberRows: 1
                    },
                    location: 's'
                }
            });

            // just testing code
            $.ajax({
                url: "system/cpuusages",
                dataType: "json"
            }).done(function(data) {
                var cpu = data.cpuUsage;
                $('#cpu-usages').text('CPU Usages :' + cpu );
            });

            $.ajax({
                url: "system/phoneNumber",
            }).done(function(data) {
                var number = data.cpuUsage;
                if ( number === "" ) {
                    number = "undefined";
                }
                $('#phoneNumber').text('phoneNumber :' + number );
            });

            $.ajax({
                url: "system/memoryInfo",
                dataType: "json"
            }).done(function(data) {
                var t = data.total;
                var u = data.usage;
                var r = data.remainder;
                $('#memory').text('Memory ( total:' + t + ', usage:' + u + ', remainder:' + r +')' );
            });
        }
    } );

} ) ();
