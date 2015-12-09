// if configured we go to control page
$(document).ready(function() {
	if (gup('reset') == 'true') {
		localStorage.clear();
		// reload page without the query string
		window.location.href=window.location.href.split('?')[0];
	}
        if (localStorage.configured) {
		$.mobile.changePage("#pageControl");
	}

	pageControlInit();
	pageConfigureInit();
});

// initiation for each page is pain, we have to rely pageshow event
/*
$(document).on('pageshow', 'div:jqmData(role="page"), div:jqmData(role="dialog")', function (event) {
        console.log("event happened " + event.type + ", id=" + $(this).attr('id'));
        var func = window[$(this).attr('id') + "Init"];
        if (typeof func === "function") func();
});
*/

var timeout;
function pageControlInit() {
	console.log("pageControlInit() called");

	$('#toggle-led-control').change(function() {
		console.log("turn LED " + $(this).val());
		controlLed($(this).val());
	});

	$('#button-control-re-configure').click(function() {
		$.mobile.changePage("#pageConfigure");
		return true;
	});

	$('#pageControl').on('pageshow', function() {
		console.log('control page is shown');
		fetchData();
	});

	$('#pageControl').on('pagehide', function() {
		console.log('control page is hidden');
		clearTimeout(timeout);
	});
}


function pageConfigureInit() {
	console.log("pageConfigureInit() called");

	// initialize initial input field
        if (localStorage.configured) {
		$('#input-channel-id').val(localStorage.channel_id);
		$('#input-channel-api-key').val(localStorage.channel_api_key);
		$('#input-brightness-field').val(localStorage.brightness_field);
		$('#input-temperature-field').val(localStorage.temperature_field);
		$('#input-led-status-field').val(localStorage.led_status_field);
		$('#input-talkback-id').val(localStorage.talkback_id);
		$('#input-talkback-api-key').val(localStorage.talkback_api_key);
	}

	$('#button-configure-save').click(function() {
		localStorage.channel_id=$('#input-channel-id').val();
		localStorage.channel_api_key=$('#input-channel-api-key').val();
		localStorage.brightness_field=$('#input-brightness-field').val();
		localStorage.temperature_field=$('#input-temperature-field').val();
		localStorage.led_status_field=$('#input-led-status-field').val();
		localStorage.talkback_id=$('#input-talkback-id').val();
		localStorage.talkback_api_key=$('#input-talkback-api-key').val();
		localStorage.configured=true;
		console.log(localStorage);
		$.mobile.changePage("#pageControl");
		return true;
	});
};

function pageErrorInit() {
	console.log("pageErrorInit() called");
}

function controlLed(state) {
	url="http://api.thingspeak.com/talkbacks/" + localStorage.talkback_id + "/commands?key=" + localStorage.talkback_api_key + "&command_string=" + state;
	console.log(url);
        var jqxhr=$.ajax({
                url: url,
                type: 'POST',
		data: {},
        })
        .done(function(a) {
		console.log("sending LED command got return : " + a);
        })
        .fail(function(jqxhr, status, msg) {
                msg="Failed to connect to server: " + status + ", " + msg;
		$('#error-message').html(localStorage.error_message);
		$.mobile.changePage('#pageError', {transition: 'pop', role: 'dialog'});
        });

}

function fetchData() {
	url = "http://api.thingspeak.com/channels/" + localStorage.channel_id + "/feeds/last.json?key=" + localStorage.channel_api_key;
	console.log("url is " + url);

        var jqxhr=$.ajax({
                url: url,
                type: 'GET',
        })
        .done(function(a) {
		console.log("Fetching data got return : ");
		console.log(a);
		var d=new Date(a['created_at']);
		$('#data-last-update').html(d.toLocaleDateString() + " " + d.toLocaleTimeString());
		$('#data-brightness').html(a[localStorage.brightness_field]);
		$('#data-temperature').html(a[localStorage.temperature_field]);
		if (a[localStorage.led_status_field] == "on") {
			$('#img-led-status').attr('src', 'light_on.png');
		} else {
			$('#img-led-status').attr('src', 'light_off.png');
		}
		$('#toggle-led-control').val(a[localStorage.led_status_field]).slider('refresh');
        })
        .fail(function(jqxhr, status, msg) {
                msg="Failed to connect to server: " + status + ", " + msg;
		$('#error-message').html(localStorage.error_message);
		$.mobile.changePage('#pageError', {transition: 'pop', role: 'dialog'});
	});

	// do it again
	timeout=setTimeout(fetchData, 15000);
}

function gup( name ) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )    return "";
    else    return results[1];
}

