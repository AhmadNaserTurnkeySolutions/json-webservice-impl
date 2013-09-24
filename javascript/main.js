$(document).ready(function() {

	// Activate the dropdowns
	$('.dropdown-toggle').dropdown();
	
	// Activate the URL field
	$("#location").focus();
	
	// validate the json on every keyup
	$("#json").keyup(function() {validateJSON();});
	
	// Hide the not needed parts
	$("#loading").hide();
	$("#result").hide();
	
	// Load the saved requests
	loadRequests();
	
	// Make the saveModal dialog save on pressing enter.
	$("#requestName").keyup(function(event){
		if (event.keyCode == 13)
		{
			// Save the request
			saveRequest();
		}
	});
		
});

/**
 * Checks the method. If the selected method is GET, disable the json field. 
 */
function checkMethod()
{
	if ($('#selectmethod').val() == 'GET') 
	{
		$('#json').attr('disabled', 'disabled');
	} 
	else 
	{
		$('#json').removeAttr('disabled');
	}
}

/**
 * Removes all data from the result of the last request.
 */
function resetResult()
{
	// Emtpy the alert
	$("#alert").html('');
	$("#alert").attr('class', 'alert');
	
	// Emtpy the response
	$("#response").html('');
	
	// Empty the request info
	$("#request-info").html('');
}

/**
 * Sets the content and class of the alert on the result page.
 */
function setAlert(message, cls)
{
	var al = $("#alert");
	al.html(message);
	al.addClass(cls);
}

/**
 * Sends the request. 
 */
function sendRequest()
{
	
	var url = $("#location").val();
	var method = $('#selectmethod').val();
	var jsonContent;
	// If the method is get, no body will be added.
	if (method == 'GET') 
	{
		jsonContent = "";	
	}
	else
	{
		jsonContent = $("#json").val();
	}
	
	// Check if an url was filled in.
	if (url.length == 0)
	{
		alert("Missing values. Please fill in the location of the webservice.");
		return;
	}
	
	// Slide out the form
	$("#form").slideUp();
	$("#loading").slideDown();
	
	// Reset the result so it's ready for new data.
	resetResult();
	
	// Start the ajax request
	$.ajax({
		contentType: 'application/json; charset=utf-8',
		data: jsonContent,
		url: url,
		type: method, 
		crossDomain: true,
		headers: {'X-Requested-With': 'XMLHttpRequest'},
		success: function(data) {
			// Show the result
			$("#loading").slideUp();
			
			if (data instanceof Object || data instanceof Array) 
			{
				$("#response").html('<pre>' + JSON.stringify(data, null, 2) + '</pre');
				setAlert('<strong>Success!</strong> Retrieved valid JSON.', 'alert-success');
			}
			else if (data == null) 
			{
				// Data is null. Show only the information. 
				setAlert('The request was executed successfully, but no data was received.', 'alert-info');
				$("#response").html('');
			}
			else 
			{
				// Turn the returned things into text
				data = data.replace(/[<]/g, '&lt;');
				data = data.replace(/[>]/g, '&gt;');
				
				//var tmp = document.createElement("div");
				//tmp.innerHTML = data;
				//data = tmp.textContent||tmp.innerText;
				$("#response").html('<pre>' + data + '</pre>');
				setAlert('<strong>Warning!</strong> Retrieved invalid JSON.', 'alert-warning');
			}
			$("#result").slideDown();
			
		}, 
		error: function (request, type, errorThrown)
		{
			setAlert('<strong>Error!</strong> There was an error while executing this request.', "alert-error");
		
		   	// Hide the loading div.
		    $("#loading").slideUp();
		    
		    // If any data was received, show it
		    $("#response").html('<pre>' + request.responseText + '</pre>');
		    
		    // show the result
		    $("#result").slideDown();
		    
		}, 
		complete: function(request, status) 
		{
			// Get some information about the request.
			var requestinfo = $("#request-info");
			requestinfo.html('');
			
			var tags = "";
			
			tags = tags + "<dt>Status</dt><dd>" + status + "</dd>";
			tags = tags + "<dt>Statustext</dt><dd>" + request.statusText + "</dd>";
			tags = tags + "<dt>HTTP Status Code</dt><dd>" + request.status + "</dd>";
			
			tags = tags + "<dt>Headers</dt><dd><ul>";
			var responseHeaders = request.getAllResponseHeaders();
			var headers = responseHeaders.split("\n");
			for (var i = 0; i < headers.length; i++) 
			{
				var header = headers[i];
				if (header !== "") {
					tags = tags + "<li>" + header + "</li>";
				}
			}
			tags = tags + "</ul></dd>";
			
			
			requestinfo.append("<dl>" + tags + "</dl>");
		}
	});
	
}


function saveRequest()
{
	var name = $("#requestName").val();
	if (name.length == 0) {
		alert("Bitte geben Sie einen Namen ein.");
		return;
	}
	
	var location = $("#location").val();
	var json = $("#json").val();
	var method = $('#selectmethod').val();
		
	var requests = JSON.parse(localStorage.getItem('requests'));
	if (requests == null) {
		requests = new Array();
	}
	
	var request = new Object();
	request['name'] = name;
	request['location'] = location;
	request['json'] = json;
	request['method'] = method;
	
	// Check if a request with the same name already exists. 
	for (var i=0; i < requests.length; i++)
	{
		if (requests[i]['name'] == name) 
		{
			// Remove that request
			requests.splice(i, 1);
			break;
		}
	}
	
	// Add the new request. 
	requests.push(request);
	
	localStorage.setItem('requests', JSON.stringify(requests));
	
	// hide the modal
	$("#saveDialog").modal('hide');
	
	// Reload the requests
	loadRequests();
}

/**
 * Loads all the saved requests from the local storage.
 */
function loadRequests()
{
	// Emtpy the menu.
	$("#requestsMenu").html("");
	$("#manageTable").html("");

	requests = JSON.parse(localStorage.getItem('requests'));
	if (requests != null && requests.length != 0) {
		// Add them 
		for (var i=0; i < requests.length; i++)
		{
			$("#requestsMenu").append("<li><a href=\"#\" onclick=\"loadRequest("+ i +");\">"+ requests[i].name +"</a></li>");
			$("#manageTable").append('<tr><td>' + requests[i].name + '</td><td><a href="#" class="btn btn-danger pull-right" onclick="removeRequest('+ i +'); loadRequests();">Remove</a></td></tr>');
		}
		
		// Add the manage button
		$("#requestsMenu").append('<li class="divider"></li>');
		$("#requestsMenu").append('<li><a data-toggle="modal" href="#manageDialog">Manage Requests</a></li>');
	}
	
	// Add the save current request option
	$("#requestsMenu").append('<li><a data-toggle="modal" href="#saveDialog">Save request</a></li>');
	
}

function loadRequest(index)
{
	var requests = JSON.parse(localStorage.getItem('requests'));
	var request = requests[index];
	
	$("#location").val(request['location']);
	$("#json").val(request['json']);
	$("#selectmethod").val(request['method']);
	
}

function removeRequest(index)
{
	var requests = JSON.parse(localStorage.getItem('requests'));
	
	// Remove that item.
	requests.splice(index, 1);
	
	// Save
	localStorage.setItem('requests', JSON.stringify(requests));
	
	// If there are no more requests, dismiss the manageDialog
	if (requests.length == 0) {
		$("#manageDialog").modal('hide')
	}
}

function backToForm()
{
	$("#result").slideUp();
	$("#form").slideDown();
}

function validateJSON()
{
	var json = $("#json").val();
	
	try {
		JSON.parse(json);
		$("#jsonvalid").html('Valid JSON');
		$("#jsonvalid").css('color', 'green');
	}
	catch(e) {
		$("#jsonvalid").html('Invalid JSON');
		$("#jsonvalid").css('color', 'red');
	}
}



function testJson()
{
var base_url = "";
var mobile_url = base_url + "m/";
var mobile_url_redirect = base_url + "m/index.php";
var mobile_url = "php/";
var pix = base_url + "portal/pix/";
var img = base_url + "portal/images/";
var regular = base_url + "portal/images/articles/";
var small = base_url + "portal/images/articles/small/";
var thumb = base_url + "portal/images/articles/thumb/";
var press = base_url + "portal/images/press/";
var magazin_putanja = base_url + "portal/images/press/";
var putanjajson = "/m/";
var stranica = "";
var offset = 0;
var offsetSekcija = 0;
var fotogalerija = 0;
var adtop = "";
var adbottom = "";
//$.getJSON(putanjajson + "php/load_index.php?method=getMagazin&offset="+offset+"&jsoncallback=?", function (data) {
	
		var data2=[
    {
        "article_id": "88032",
        "article_title": "Pogledajte dva nastupa sa američkog 'X Factora' koji su oduševili sve!",
        "article_section_id": "41",
        "article_pre_title": "",
        "article_subtitle": "",
        "article_short_text": "U novoj sezoni američkog izdanja &quot;X Factora&quot; pojavila se 13-godišnja Rion Paige koja je odmah oduševila žiri i publiku i postala instant-zvijezda. ",
        "section_name": "JET-SET",
        "section_parent": "SHOWTIME",
        "main_photo": "pogledajte-dva-nastupa-sa-americkog-x-factora-koji-su-odusevili-sve.jpg",
        "photo_number": "0",
        "articles_photos_name": "test.jpg",
        "article_photos": 0,
        "article_create_date": "13.09.2013."
    },
    {
        "article_id": "88031",
        "article_title": "Eurobasket: Litvanija preko Belgije u četvrtfinale",
        "article_section_id": "22",
        "article_pre_title": "",
        "article_subtitle": "",
        "article_short_text": "Košarkaši Litvanije pobijedili su Belgiju s 86:67 (18:12, 44:21, 69:35), u drugom kolu 2. runde Evropskog prvenstva u Sloveniji i na taj način se plasirali u četvrtfinale ",
        "section_name": "KOŠARKA",
        "section_parent": "SPORT",
        "main_photo": "eurobasket-litvanija-preko-belgije-u-cetvrtfinale.jpg",
        "photo_number": "0",
        "articles_photos_name": "test.jpg",
        "article_photos": 0,
        "article_create_date": "13.09.2013."
    },
    {
        "article_id": "88030",
        "article_title": "Dačić u Predsjedništvu BiH: Zajedno na treća tržišta",
        "article_section_id": "11",
        "article_pre_title": "",
        "article_subtitle": "",
        "article_short_text": "Predsjedatelj Predsjedništva BiH Željko Komšić i član Predsjedništva BiH Nebojša Radmanović primili su predsjednika Vlade i ministra unutarnjih poslova Republike Srbije Ivicu Dačića.",
        "section_name": "BIH",
        "section_parent": "VIJESTI",
        "main_photo": "dacic-u-predsjednistvu-bih-i-srbija-zajedno-na-treca-trzista.jpg",
        "photo_number": "2",
        "articles_photos_name": "test.jpg",
        "article_photos": "dacic-u-predsjednistvu-bih-i-srbija-zajedno-na-treca-trzista.jpg;dacic-u-predsjednistvu-bih-i-srbija-zajedno-na-treca-trzista_0.jpg;dacic-u-predsjednistvu-bih-i-srbija-zajedno-na-treca-trzista_1.jpg;",
        "article_create_date": "13.09.2013."
    },
    {
        "article_id": "88029",
        "article_title": "Ekstremni glodar i lakoća upravljanja: Hrčak upravljao novim Volvo kamionom teškim 15 tona!",
        "article_section_id": "56",
        "article_pre_title": "",
        "article_subtitle": "",
        "article_short_text": "Ovo je trenutak kada je šestomjesečni hrčak uspješno upravljao s kamionom od 15 tona po kamenolomu.",
        "section_name": "AUTO-MOTO",
        "section_parent": "LIFESTYLE",
        "main_photo": "ekstremni-glodar-i-lakoca-upravljanja-hrcak-upravljao-novim-volvo-kamionom-teskim-15-tona.jpg",
        "photo_number": "0",
        "articles_photos_name": "test.jpg",
        "article_photos": 0,
        "article_create_date": "13.09.2013."
    },
    {
        "article_id": "88028",
        "article_title": "Egipat: Hiljade islamista traže povratak Morsija",
        "article_section_id": "14",
        "article_pre_title": "",
        "article_subtitle": "",
        "article_short_text": "Hiljade islamista demonstriralo je danas u Egiptu tražeći povratak na vlast bivšeg predsjednika Mohameda Morsija, koga je vojska svrgnula početkom jula.Demonstranti su uzvikivali parole protiv vojne vlasti i nosili transparente sa fotografijama svrgnutog predsjednika.",
        "section_name": "SVIJET",
        "section_parent": "VIJESTI",
        "main_photo": "egipat-hiljade-islamista-traze-povratak-morsija.jpg",
        "photo_number": "0",
        "articles_photos_name": "test.jpg",
        "article_photos": 0,
        "article_create_date": "13.09.2013."
    }

];





	$.ajax({
		contentType: 'application/json; charset=utf-8',
		data: '',
		url: "http://www.oslobodjenje.ba/m/php/load_index.php?method=getMagazin",
		type: "GET", 
		crossDomain: true,
		headers: {'X-Requested-With': 'XMLHttpRequest'},
		success: function(data) {
		var x=data.substr(1,data.length-2);//remove ()
		x=JSON.parse(x);//convert string to json object
		
		        $.each(x, function (index, item) {
	
            var sections = "";
            if (item.section_parent) {
                sections = "<strong>" + item.section_parent + "</strong> > " + item.section_name;
            } else {
                sections = item.section_name;
            }
            var images = small + item.main_photo;
            output = output + "<li id=\"articleli\" name=\"" + item.article_id + "\"><a class=\"ui-link-inherit\" href=\"#article\" onclick=\"setVijest(" + item.article_id + ")\" data-backbtn=\"true\" data-back-btn-text=\"Back\" ><span class=\"imgbox\"><img src=\"" + images + "\" width=\"110\" ></span><h2>" + item.article_title + "</h2><p>" + sections + " | <span class=\"date\">" + item.article_create_date + "</span></p> </a></li>";

        });
		
			$('#form-actions-response').html(output);
		}
		});



	//$.getJSON("http://www.oslobodjenje.ba/m/php/load_index.php?method=getMagazin", function (data) {

        var output_top = '';
        var output = '';
        var brojac = 1;
			

		/*
        $.each(data, function (index, item) {
            var sections = "";
            if (item.section_parent) {
                sections = "<strong>" + item.section_parent + "</strong> > " + item.section_name;
            } else {
                sections = item.section_name;
            }
            var images = small + item.main_photo;
            output = output + "<li id=\"articleli\" name=\"" + item.article_id + "\"><a class=\"ui-link-inherit\" href=\"#article\" onclick=\"setVijest(" + item.article_id + ")\" data-backbtn=\"true\" data-back-btn-text=\"Back\" ><span class=\"imgbox\"><img src=\"" + images + "\" width=\"110\" ></span><h2>" + item.article_title + "</h2><p>" + sections + " | <span class=\"date\">" + item.article_create_date + "</span></p> </a></li>";

        });
		*/
//$('#form-actions-response').html(data);

//$('#form-actions-response').html(output);
//});

}


