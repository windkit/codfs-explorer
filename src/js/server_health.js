/*
 *	To query health of server and response to the change of health of server
 *	Using WebSocket to commulate with server
 */
var interval_ret = null;
var in_recov = 0;

// to query the health of server
function server_health_main()
{
	polling_server();
	interval_ret = setInterval(polling_server, 10000);
}

function polling_server()
{
	$.ajax({
		url: 'polling.php',
		dataType: 'json',
		type: 'POST'
	}).done(function(reply, textStatus, jqXHR){
		switch(reply['ret'])
		{
			case 0:	// finised recovery
				console.log('Nothing happen');
				break;
			case 1:	// in recovery mode
				console.log('in recovery');
				if(in_recov == 0)
				{
					var $recover_msg = $('#recover-msg');
					in_recov = 1;
					$recover_msg.removeClass('alert-success').addClass('alert-danger');
					$recover_msg.html("Recovering OSD <strong>NOW</strong>");
					$recover_msg.fadeIn();
					// query more frequent to check if server finished recovery
					interval_ret = ch_interval_time(interval_ret, 3000, polling_server);
				}
				break;
			case 2:	// finish recover
				if(in_recov)
				{
					// reset the indicator
					in_recov = 0;
					console.log('finished recovery');
					var $recover_msg = $('#recover-msg');
					$recover_msg.removeClass('alert-danger').addClass('alert-success');
					$recover_msg.html("Recovering OSD <strong>SUCCESSFULLY</strong><br>The recovery takes " + reply['time'] + ' s');
					setTimeout(function(){
						$recover_msg.fadeOut();
					}, 3000);
					// restore back the update time
					interval_ret = ch_interval_time(interval_ret, 10000, polling_server);
				}
				break;
		}
	});
}

function ch_interval_time(interval_var, time, func)
{
	clearInterval(interval_var);
	interval_var = setInterval(func, time);
	return interval_var;
}
