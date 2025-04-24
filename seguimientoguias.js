Ext.onReady(function () {
    var socket = io.connect('http://192.168.0.205:4000');
    var url = "/agro/BodegaGuias/";
    const tipo = 4;

    var store = Ext.create("Ext.data.Store", {
        autoLoad: true,
        fields: [
            "TransId", "FechaTransaccion", "FechaImpresion", "Proceso", "IdCliente",
            "Cliente", "Rep2id", "Vendedor", "EstadoTransaccion", "Observaciones",
            "TipoEnvio", "Ubicacion", "Transportadora", "Guia", "Administrador",
            "Operario", "Id", "Fecha", "Flete", "ValorFlete", "Bodega"
        ],
        proxy: {
            type: "ajax",
            url: url + "obtenerPickedList",
            extraParams: { Tipo: tipo, Fecha: Ext.Date.format(new Date(), 'd/m/Y'), Bodega: 'Todos' },
            reader: { type: "json", rootProperty: "data" }
        }
    });

    function obtenerLinkTransportadora(nombre, guia) {
        let url = "";
        let nombreLower = nombre.toLowerCase();

        if (nombreLower.includes("chevalier")) {
            url = `https://chevalier.fivesoft.com.co/tag_detail_v1.html?d=${guia}`;
        } else if (nombreLower.includes("tcc")) {
            url = `https://tcc.com.co/courier/mensajeria/rastrear-envio/`;
        } else if (nombreLower.includes("servientrega")) {
            url = `https://www.servientrega.com/wps/portal/rastreo-envio`;
        } else if (nombreLower.includes("coordinadora")) {
            url = `https://coordinadora.com/rastreo/rastreo-de-guia/detalle-de-rastreo-de-guia/?guia=${guia}`;
        } else if (nombreLower.includes("interrapidisimo")) {
            url = `https://interrapidisimo.com/sigue-tu-envio/`;
        } else if (nombreLower.includes("encoexpress")) {
            url = `https://seguimientoguias.encoexpres.co/?numerog=${guia}`;
        } else if (nombreLower.includes("rápido ochoa") || nombreLower.includes("rapido ochoa")) {
            url = `https://rapidoochoa.tmsolutions.com.co/tmland/faces/public/tmland-carga/cotizador_envios.xhtml?parametroInicial=cmFwaWRvb2Nob2E=`;
        }

        return url;
    }

    Ext.create('Ext.container.Viewport', {
        layout: 'fit',
        items: [{
            xtype: 'grid',
            id: 'tabla',
            title: '<img src="/agro/assets/img/logo.png" style="height:20px; vertical-align:middle; margin-right:8px;"> Guías Despachadas - Vista para Asesores',
            features: [{
                ftype: 'grouping',
                groupHeaderTpl: '{columnName}: {name} ({rows.length} elemento{[values.rows.length > 1 ? "s" : ""]})',
                enableGroupingMenu: true
            }],
            viewConfig: { enableTextSelection: true },
            selModel: { selType: 'cellmodel' },
            store: store,
            columns: [
                { header: 'Remisión', dataIndex: 'TransId', width: 120 },
                {
                    header: 'Bodega',
                    dataIndex: 'Bodega',
                    width: 80,
                    renderer: function (value) {
                        let clase = '';
                        let texto = value;

                        if (!value || value.toLowerCase() === 'null') {
                            clase = 'bodega-null';
                            texto = 'Sin bodega';
                        } else {
                            const val = value.toString().trim().toUpperCase();
                            if (val === 'P1') clase = 'bodega-P1';
                            else if (val === 'A') clase = 'bodega-A';
                            else {
                                clase = 'bodega-null';
                                texto = 'Sin bodega';
                            }
                        }

                        return `<span class="${clase}">${texto}</span>`;
                    }
                },
                { header: 'Cliente', dataIndex: 'Cliente', flex: 1, minWidth: 250 },
                { header: 'Guía', dataIndex: 'Guia', minWidth: 160 },
                {
                    header: 'Transportadora',
                    dataIndex: 'Transportadora',
                    minWidth: 200,
                    renderer: function (val, meta, record) {
                        const guia = record.get('Guia');
                        const nombre = val.toLowerCase();
                        let clase = '';

                        if (nombre.includes("servientrega")) clase = 'color-servientrega';
                        else if (nombre.includes("coordinadora")) clase = 'color-coordinadora';
                        else if (nombre.includes("chevalier")) clase = 'color-chevalier';
                        else if (nombre.includes("tcc")) clase = 'color-tcc';
                        else if (nombre.includes("rapido ochoa")) clase = 'color-rapidoochoa';
                        else if (nombre.includes("encoexpress")) clase = 'color-EncoExpress';
                        else if (nombre.includes("interrapidisimo")) clase = 'color-interrapidisimo';

                        const link = obtenerLinkTransportadora(val, guia);
                        return link ?
                            `<a href="${link}" target="_blank" class="${clase}">${val}</a>` :
                            `<span>${val}</span>`;
                    }
                },
                { header: 'Flete', dataIndex: 'Flete', minWidth: 120 },
                {
                    header: 'Valor Flete',
                    dataIndex: 'ValorFlete',
                    minWidth: 130,
                    renderer: function (value) {
                        return parseInt(value).toLocaleString('es-CO', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                    }
                },
                { header: 'Fecha Impresión', dataIndex: 'FechaImpresion', minWidth: 160 },
                { header: 'Fecha Despacho', dataIndex: 'Fecha', minWidth: 160 },
                { header: 'Vendedor', dataIndex: 'Vendedor', minWidth: 160 }, // Nueva columna
                { header: 'Observaciones', dataIndex: 'Observaciones', flex: 1, minWidth: 200 }
            ],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: [
                    {
                        xtype: 'combo',
                        fieldLabel: 'Filtrar por Bodega',
                        id: 'bodegaFiltro',
                        editable: false,
                        store: ['Todos', 'P1', 'A'],
                        value: 'Todos',
                        listeners: { change: recargarStore }
                    },
                    {
                        xtype: 'datefield',
                        fieldLabel: 'Fecha',
                        id: 'fechaFiltro',
                        editable: false,
                        value: new Date(),
                        format: 'd/m/Y',
                        listeners: { change: recargarStore }
                    },
                    {
                        xtype: 'textfield',
                        fieldLabel: 'Buscar Remisión',
                        id: 'remisionFiltro',
                        emptyText: 'Escriba el # de remisión...',
                        width: 280
                    },
                    {
                        xtype: 'button',
                        text: 'Buscar Remisión',
                        handler: function () { recargarStore(true); }
                    },
                    {
                        xtype: 'button',
                        text: 'Actualizar',
                        handler: function () { recargarStore(); }
                    }
                ]
            }]
        }]
    });

    function recargarStore(filtrarPorRemision = false) {
        const bodega = Ext.getCmp('bodegaFiltro').getValue();
        const remision = Ext.getCmp('remisionFiltro').getValue();
        const fecha = Ext.Date.format(Ext.getCmp('fechaFiltro').getValue(), 'd/m/Y');
        const params = { Tipo: tipo, Bodega: bodega };

        if (filtrarPorRemision && remision) {
            params.Remision = remision.padStart(8, '0');
        } else {
            params.Fecha = fecha;
        }

        store.getProxy().extraParams = params;
        store.load();
    }
});
