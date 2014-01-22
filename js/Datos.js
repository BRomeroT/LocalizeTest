var Datos = {

    unidadesSelectId: "unidadesSelect",

    Unidades: {},

    EstacionSeleccionada: null,

    Eventos: null,

    pinDevice: null,

    EventosMapa: {
        Pin_Click: function (pin) {
            Datos.SeleccionarPin(pin)
        }
    },

    Autentificar: function (usuario, contrasena, resultado) {
        var Params = {};
        Params.type = 'GET';
        Params.url = 'http://localize.dyndns-ip.com/ClientBin/Localize-Web-ServicioRIA.svc/JSON/GetUsuarios?$where=((it.usuario1.Trim().ToLower()%253d%253d%2522' +
            usuario + '%2522)%2526%2526(it.passweb.Trim()%253d%253d%2522' + contrasena + '%2522))&$includeTotalCount=True';
        //Params.dataType = 'json';
        Params.success = function (res) {
            var data = $.parseJSON(res.responseText);
            var autentificado = (data.GetUsuariosResult.TotalCount == 1);
            if (autentificado)
                resultado(true, data.GetUsuariosResult.RootResults[0].flotilla);
            else
                resultado(false, "");
        };
        $.ajax(Params);
    },

    SeleccionarPin: function (pin) {
        //analiza los datos del pin y manda a seleccionar la estación
        //Datos.SeleccionarUnidad($(pin._htmlContent).attr('id').replace('estacion', ''));
    },

    SeleccionarUnidad: function (unidadId) {
        var unidad = Datos.Unidades[unidadId];
        if (Datos.EstacionSeleccionada != unidad) {
            Datos.EstacionSeleccionada = unidad;
            //Selecciona en el Select la estación correspondiente (por si fue seleccionada en el mapa)
            if ($("#" + Datos.estacionesSelectId).val() != unidad.Id) {
                $("#" + Datos.estacionesSelectId + " option").removeAttr("selected");
                $("#" + Datos.estacionesSelectId + " option[value=" + unidadId + "]").attr("selected", "selected");
            }
            Datos.Eventos.UnidadSeleccionada(unidad);
        }
    },

    CargarFlotilla: function (flotilla) {
        var Params = {};
        Params.type = 'GET';
        Params.url = 'http://localize.dyndns-ip.com/ClientBin/Localize-Web-ServicioRIA.svc/JSON/ObtenerVehiculosDeGrupo?grupo=' + flotilla;
        //Params.dataType = 'json';
        Params.success = function (res) {
            var data = $.parseJSON(res.responseText);
            var esPrimera = true;//para selecionar la primera estacion
            for (var i in data.ObtenerVehiculosDeGrupoResult.RootResults) {
                var unidad = data.ObtenerVehiculosDeGrupoResult.RootResults[i];
                Datos.Unidades[unidad.Id] = unidad;
                /*Llenar el select*/
                if (esPrimera == true) {
                    $("#" + Datos.unidadesSelectId).append('<option value="' + unidad.Id + '" selected="selected">' + unidad.Etiqueta + '</option>');
                } else {
                    $("#" + Datos.unidadesSelectId).append('<option value="' + unidad.Id + '">' + unidad.Etiqueta + '</option>');
                }
                $("#" + Datos.unidadesSelectId).change(function () {
                    Datos.MostrarUnidad($(this).val());
                    //Datos.SeleccionarUnidad($(this).val());
                });
                if (esPrimera == true) {
                    esPrimera = false;
                    Datos.MostrarUnidad(unidad.Id);
                    //Datos.SeleccionarUnidad(unidad.Id);
                }
            }
            Datos.Eventos.UnidadesListas();
        };
        $.ajax(Params);
    },

    MostrarUnidad: function (unidadId) {
        Mapa.LimpiarDatos();
        if (Datos.pinDevice != null) Mapa.MostrarPin(Datos.pinDevice);
        var unidad = Datos.Unidades[unidadId];
        var Params = {};
        Params.type = 'GET';
        Params.url = 'http://localize.dyndns-ip.com/ClientBin/Localize-Web-ServicioRIA.svc/JSON/GetUltimoPuntoLogHoy?unidad=' + unidad.unidad;
        //Params.dataType = 'json';
        Params.success = function (res) {
            var data = $.parseJSON(res.responseText);
            var punto = data.GetUltimoPuntoLogHoyResult.RootResults[0];
            Mapa.AgregarPin('<img src="img/Car.png" alt="' + punto.vel + '" />', punto.lat, punto.lon);
            Mapa.Centrar(punto.lat, punto.lon);
        };
        $.ajax(Params);
    },

    Limpiar: function () {
        $.each(Datos.Estaciones, function (index, value) {
            $("#M-" + value.Numero).empty();
        });
    },

    MonitorearDispositivo: function (opciones) {
        var watchID = navigator.geolocation.watchPosition(
            function (position) {
                if (Datos.pinDevice == null) {
                    Datos.pinDevice = Mapa.AgregarPin('<img src="img/Target.png" alt="Yo" />', position.coords.latitude, position.coords.longitude);
                } else {
                    Mapa.MoverPin(Datos.pinDevice, position.coords.latitude, position.coords.longitude);
                }
                if (opciones != null) {
                    if (opciones.Centrar) Mapa.Centrar(position.coords.latitude,position.coords.longitude);
                }
            }, function (error) {
                //alert(error);
            }, { timeout: 30000 });
    }
}