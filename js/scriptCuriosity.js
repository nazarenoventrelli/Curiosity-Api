
/////////////////////////////////////////////////////////////
//elementos del dom
var imagen = document.getElementById("imagen");
var imgGaleria = document.getElementById("imgGaleria");

var campoFecha = document.getElementById("input_fecha");
var btn_anterior = document.getElementById("btn_anterior");
var btn_siguiente = document.getElementById("btn_siguiente");

var texto_fecha = document.getElementById("texto_fecha");
var texto_cantidad = document.getElementById("texto_cantidad");
var texto_sol = document.getElementById("texto_sol");
var barraProgreso = document.getElementById("bar");

btn_anterior.onclick=function(){navegar("anterior")};
btn_siguiente.onclick=function(){navegar("siguiente")};


/////////////////////////////////////////////////////////////
//variables a enviar en las peticiones a la api
//fecha,apiKey y url
var fechaHoy = new Date().toJSON().slice(0,10);
$("#datepicker").val(fechaHoy);
var fecha=fechaHoy;

var apiKey ="zGfoWX4ycAxRqt78xt9Xmpfm4tc6ZrFMPYAhsxfu";

var url = "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos";


/////////////////////////////////////////////////////////////
//variables generales
var cantidadAct=0;
var datosAct;

var arrayImagenes=[];

var imgCargadas;
var dateTemp;

var estadoPreCarga;
var preCargadas=0;
var cantPreCargar=10;

var enviarConsulta = false; 
var consultaEnviada= false;

var preCargaArray = [];
//funcion de busqueda en el array
function buscarFecha(element) {
  return element.fecha == fecha;
}
//funcion de ordenamiento
function compare(a,b) {
  if (a.fecha < b.fecha)
    return -1;
  if (a.fecha > b.fecha)
    return 1;
  return 0;
}


/////////////////////////////////////////////////////////////

// control de envio de consultas a la api/memoria

function navegar(direccion){
	enviarConsulta= false;

	if(direccion=="anterior"){
		restarDia();
	}else{
		sumarDia();
	}
	if (consultaEnviada){
		consultaEnviada=false;
		esperar();
	}
	texto_fecha.innerText=fecha;
	texto_cantidad.innerText="";
	texto_sol.innerText="";
}

function esperar(){
		if (enviarConsulta){
			consulta();
			consultaEnviada=true;
		}

		enviarConsulta=true;
		if (!consultaEnviada){
			setTimeout(function(){esperar()},500);
		}
		
}

/////////////////////////////////////////////////////////////
//crea la pantalla de carga inicial y bloquea la ui
var barraInicial = barraProgreso.cloneNode(true);
barraInicial.id="barInicial";

var msje='<div class="row justify-content-md-center"><img src="img/cargando.gif" class="imgCargando"/></div>';
 msje+='<div class="progress row">'+barraInicial.outerHTML+'</div>';

$.blockUI({message:msje,css:{
	border:'none',
	top:'30%',
	left:'30%',
}});

barraInicial = document.getElementById("barInicial");
/////////////////////////////////////////////////////////////



setTimeout(preCargarDatos,1000);


/////////////////////////////////////////////////////////////
//eventos del calendario datepicker
$(function () {
        $("#datepicker").datepicker();
    });

$("#datepicker").change(function(){
	fecha=$("#datepicker").val();
	consulta();
});

$( function() {
	$( document ).tooltip();
} );

//restar y avanzar dias
function sumarDia(){
 dateTemp = $('#datepicker').datepicker('getDate', '+1d'); 
 dateTemp.setDate(dateTemp.getDate()+1); 
$('#datepicker').datepicker('setDate', dateTemp);
fecha=$("#datepicker").val();
}

function restarDia(){
 dateTemp = $('#datepicker').datepicker('getDate', '-1d'); 
 dateTemp.setDate(dateTemp.getDate()-1); 
$('#datepicker').datepicker('setDate', dateTemp);
fecha=$("#datepicker").val();
}

/////////////////////////////////////////////////////////////

function inicializar(){
	$("#contenedorPrincipal").html("");
	datosAct="";
	cantidadAct=0;
	liberarMemoria();
	arrayImagenes=[];
	imgCargadas=0;
	barraProgreso.style.width= 0+"%";
}

function preCargarDatos(){
	estadoPreCarga="cargarJson";
	for(var i =0;i<cantPreCargar;i++){

		restarDia();
		consulta();
	}

}
function cargarUltimaFechaDisponible(){

	datosAct=preCargaArray[preCargaArray.length-1].datos;
	cantidadAct=preCargaArray[preCargaArray.length-1].cantidad;

	fecha=datosAct.photos[1].earth_date;
	$("#datepicker").val(fecha);

	mostrarDatos();
}


var buscar;

function consulta(){
	buscar = preCargaArray.findIndex(buscarFecha);
	inicializar();
	if ((buscar) == -1 ){
		hacerPeticion();
	}else{

		datosAct=preCargaArray[buscar].datos;
		cantidadAct=preCargaArray[buscar].cantidad;
		mostrarDatos();
	}

	
}
function hacerPeticion(){

	
		$.ajax({
			url:url,
			type:'get',
			data:{ earth_date:fecha , api_key:apiKey },
			success:function(result){

				datosAct=result;
				cantidadAct=result.photos.length;
				if (cantidadAct>0){
					preCargaArray.push({"datos":datosAct,"fecha":result.photos[0].earth_date,"cantidad":cantidadAct});
					preCargaArray.sort(compare);
				}
				
			
				if (estadoPreCarga=="cargarJson"){
					cargaInicial();
					}else{
						if (estadoPreCarga=="cargaCompleta"){
							mostrarDatos();
						}
				}
			
			},
			error:function(result){

				console.log("error");
				console.log(result);
			}
		});
	}

function cargaInicial(){

		preCargadas++;
		barraInicial.style.width = Math.round( (preCargadas*100) /cantPreCargar)+"%";
		
		if (preCargadas == cantPreCargar){

			//carga las primeras imagenes
			estadoPreCarga="cargaCompleta";
			setTimeout(function(){$.unblockUI()},500);
			cargarUltimaFechaDisponible();

			setTimeout(function(){esperar()},2000);
		}
	
}

function mostrarDatos (){
	//muestra imagen default o info de la img actual
	if (cantidadAct>0){
		preCargarImagenes();

		texto_fecha.innerText=fecha;
		texto_cantidad.innerText=cantidadAct;
		texto_sol.innerText=datosAct.photos[0].sol;
	}else{
		texto_fecha.innerText=fecha;
		texto_cantidad.innerText="No hay fotos para esta fecha";
	}


}
function preCargarImagenes(){
	for (var i =0;i<cantidadAct;i++){
		
		var fancyBox = crearFancyBox(i);

		arrayImagenes.push(fancyBox);
	}
	mostrarGaleriaImagenes();
}


function crearFancyBox(i){
		var imagen = new Image();
		var linkImg = document.createElement("a");

		linkImg.id="imgGal-"+i;
		linkImg.href=datosAct.photos[i].img_src;
		linkImg.setAttribute("data-fancybox","gallery");
		var leyenda="JPL Caltech Curiosity Rover : ";
		leyenda+=datosAct.photos[i].camera.full_name+" : "+datosAct.photos[i].earth_date;
		
		linkImg.setAttribute("data-caption",leyenda);
		
		var imagenRelleno = new Image();
		imagenRelleno.src="img/default.jpg";
		imagenRelleno.classList.add("imgGal");

		imagen.id = "img-"+i;
		imagen.src=datosAct.photos[i].img_src;
		imagen.classList.add("imgGal");

		imagen.onload=function(){
			imgCargadas++;
			barraProgreso.style.width = Math.round( (imgCargadas*100) /cantidadAct)+"%";
			
			var id = imagen.id.split("-");
			id = id[1];

			var linkAct = document.getElementById("imgGal-"+id);
			if (linkAct != null){
				linkAct.removeChild(linkAct.firstChild);
				linkAct.appendChild(imagen);
			}
		};
		
		linkImg.appendChild(imagenRelleno);

		return {imagen:imagen,linkImg:linkImg};
	}


function crearFila(){
	var fila = document.createElement("div")

	fila.classList.add("row");
	return fila;
}
function crearColumna(){
	var col = document.createElement("div");

	col.classList.add("col");
	return col;
}

function mostrarGaleriaImagenes(){
	var contadorFilas=0;
	var fila = crearFila();
	var columna;

	for(var i=0;i<cantidadAct;i++){

		columna = crearColumna();
		columna.appendChild(arrayImagenes[i].linkImg);
		fila.appendChild(columna);

		contadorFilas++;

		if (contadorFilas==4){
			contadorFilas=0;
			$("#contenedorPrincipal").append(fila);
			fila = crearFila();
		}else{
			if((cantidadAct-i)<4){
				$("#contenedorPrincipal").append(fila);
			}
		}

		}
		
	}


function liberarMemoria(){

		for (var i =0;i<arrayImagenes.length;i++){
			arrayImagenes[i].imagen.removeAttribute("src");
			arrayImagenes[i].imagen=null;

			arrayImagenes[i].linkImg.removeAttribute("href");
			arrayImagenes[i].linkImg=null;
		}
}
$("#btn_info").on('click', function() {

  $.fancybox.open({
    src  : 'https://mars.nasa.gov/msl/mission/mars-rover-curiosity-mission-updates/',
    type : 'iframe'
  });
});
$("#btn_ubicacion").on('click', function() {

  $.fancybox.open({
    src  : 'https://mars.nasa.gov/msl/mission/whereistherovernow/',
    type : 'iframe'
    
  });

});


